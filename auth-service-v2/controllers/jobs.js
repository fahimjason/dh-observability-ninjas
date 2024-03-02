const mongoose = require('mongoose');
const moment = require('moment');
const axios =  require('axios');
const { trace, context, propagation } = require('@opentelemetry/api');

const { StatusCodes } = require('http-status-codes');
const { NotFoundError } = require('../errors/not-found');

const Job = require('../models/Job');

const getAllPosts = async (req, res) => {
    const parentSpan = trace.getSpan(context.active());

    try{
        const user = req.user;
        // {
        //     id: 1,
        //     name: 'user',
        //     email: 'user@mail.com'
        // };

        if(parentSpan && req.user) {
            parentSpan.setAttribute('user.id', user);
        }

        const validateResponse = await context.with(
            trace.setSpan(context.active(), parentSpan),
            async() => {
                const carrier = {};
                propagation.inject(context.active(), carrier); 
                parentSpan.end();
                return axios.get(process.env.BACKEND_SERVICE_2, {
                    headers: carrier
                });
            }
        );

        res.json(validateResponse.data);
    } catch(e) {
        console.log("Error:", e.message)
        if(parentSpan) {
            // console.log(parentSpan)
            parentSpan.recordException(e)
        }
        return;
    }
};

const getAllJobs = async (req, res) => {
    const { search, status, jobType, sort } = req.query;

    const queryObject = {
        createdBy: req?.user?.userId,
    };

    if (search) {
        queryObject.position = { $regex: search, $options: 'i' };
    }

    if (status && status !== 'all') {
        queryObject.status = status;
    }

    if (jobType && jobType !== 'all') {
        queryObject.jobType = jobType;
    }

    let result = Job.find(queryObject);

    if (sort === 'latest') {
        result = result.sort('-createdAt');
    }

    if (sort === 'oldest') {
        result = result.sort('createdAt');
    }

    if (sort === 'a-z') {
        result = result.sort('position');
    }

    if (sort === 'z-a') {
        result = result.sort('-position');
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    result = result.skip(skip).limit(limit);

    const jobs = await result;

    const totalJobs = await Job.countDocuments(queryObject);
    const numOfPages = Math.ceil(totalJobs / limit);

    res.status(StatusCodes.OK).json({ jobs, totalJobs, numOfPages });
};

const getJob = async (req, res) => {
    const { user: { userId }, params: { id: jobId } } = req;

    const parentSpan = trace.getSpan(context.active()); 

    const job = await Job.findOne({
        _id: jobId,
        createdBy: userId,
    });

    if (!job) {
        throw new NotFoundError(`No job with id ${jobId}`);
    }

    res.status(StatusCodes.OK).json({ job });
};

const createJob = async (req, res) => {
    req.body.createdBy = req.user.userId;

    const job = await Job.create(req.body);

    res.status(StatusCodes.CREATED).json({ job });
};

const updateJob = async (req, res) => {
    const { body: { company, position }, user: { userId }, params: { id: jobId }, } = req;

    if (company === '' || position === '') {
        throw new BadRequestError('Company or Position fields cannot be empty');
    }

    const job = await Job.findByIdAndUpdate(
        { _id: jobId, createdBy: userId },
        req.body,
        { new: true, runValidators: true }
    );

    if (!job) {
        throw new NotFoundError(`No job with id ${jobId}`);
    }

    res.status(StatusCodes.OK).json({ job });
};

const deleteJob = async (req, res) => {
    const { user: { userId }, params: { id: jobId } } = req;

    const job = await Job.findByIdAndRemove({
        _id: jobId,
        createdBy: userId,
    });

    if (!job) {
        throw new NotFoundError(`No job with id ${jobId}`);
    }

    res.status(StatusCodes.OK).send();
};

const showStats = async (req, res) => {
    let stats = await Job.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(req.user.userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    stats = stats.reduce((acc, curr) => {
        const { _id: title, count } = curr;
        acc[title] = count;
        return acc;
    }, {});

    const defaultStats = {
        pending: stats.pending || 0,
        interview: stats.interview || 0,
        declined: stats.declined || 0,
    };

    let monthlyApplications = await Job.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(req.user.userId) } },
        {
            $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 }
    ]);

    monthlyApplications = monthlyApplications
        .map((item) => {
            const { _id: { year, month }, count, } = item;

            const date = moment()
                .month(month - 1)
                .year(year)
                .format('MMM Y');

            return { date, count };
        })
        .reverse();

    res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications });
};

module.exports = {
    getAllJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    showStats,
    getAllPosts
};