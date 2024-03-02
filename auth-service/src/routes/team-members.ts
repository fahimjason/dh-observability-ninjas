import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { body } from 'express-validator';

import { Team } from '../models/team';
import { TeamMember, TeamMemberModel } from '../models/team-member';
import { User } from '../models/user-sequelize';
import { currentUser } from '../middlewares/current-user';
import { requireAuth } from '../middlewares/require-auth';
import { BadRequestError } from '../errors/bad-request-error';
import { validateRequest } from '../middlewares/validate-request';
import { requireAuthorize } from '../middlewares/require-authorize';
import { NotFoundError } from '../errors/not-found-error';
import sendEmail from '../services/send-email';
import { NotAuthorizedError } from '../errors/not-authorized-error';


const router = express.Router();

router.get('/api/teammembers', currentUser, requireAuth, requireAuthorize('admin'), async (req: Request, res: Response) => {
    const teamMembers = await TeamMember.findAll({
        include: [
            {
                model: User,
                attributes: ['id', 'email']
            },
            {
                model: Team,
                attributes: ['id', 'name', 'category']
            },
        ],
        attributes: ['id', 'status', 'createdAt', 'updatedAt']
    });

    res.status(200).send(teamMembers);
});

router.get('/api/teammembers/:teamId', currentUser, requireAuth, async (req: Request, res: Response) => {
    const teamMembers = await TeamMember.findAll({
        where: {
            team_id: req.params.teamId,
            status: 'active'
        },
        include: [
            {
                model: User,
                attributes: ['email']
            }
        ],
        attributes: ['id', 'status']
    });

    if (!teamMembers) {
        throw new NotFoundError();
    }

    res.status(200).send(teamMembers);
});

router.post('/api/teammembers',
    currentUser,
    requireAuth,
    requireAuthorize('admin'),
    [
        body('email')
            .isEmail()
            .withMessage('Email must be valid'),
        body('team_id')
            .notEmpty()
            .isInt({ min: 1 })
            .toInt()
            .withMessage('Team ID must need to be valid')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        const { email, team_id } = req.body;

        const user = await User.findOne({
            where: {
                email
            }
        });

        if (!user) {
            throw new BadRequestError('User not found');
        }

        const team = await Team.findByPk(team_id);

        if (!team) {
            throw new BadRequestError('Team not found');
        }

        const existingTeamMember = await TeamMember.findOne({
            where: {
                user_id: user.dataValues.id,
                team_id: team_id
            }
        });

        if (existingTeamMember) {
            return res.send({ message: 'User already exist in the team' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const expire = new Date(Date.now() + 60 * 60 * 1000);

        let teamMember: TeamMemberModel | undefined; // Explicitly define the type

        if (user?.dataValues?.id !== undefined) {
            teamMember = TeamMember.build({
                user_id: user.dataValues.id,
                team_id: team_id,
                token: hashedToken,
                tokenExpire: expire
            });
        }

        // Create join and reject url
        const joinUrl = `${req.protocol}://${req.get('host')}/api/teammembers/${team_id}/join/${token}`;
        const rejectUrl = `${req.protocol}://${req.get('host')}/api/teammembers/${team_id}/reject/${token}`;

        const message = `You are receiving this email because you (or someone else) has requested the to join you ${team?.name}. Please click on the link to join the team: \n\n ${joinUrl} \n\n If you want to reject the request please click on the link: \n\n ${rejectUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Team Invitation',
                message
            });

            await teamMember?.save();
        } catch (err) {
            console.log(err);
        }

        res.status(201).send({ message: 'Email Sent' });
    });

router.patch('/api/teammembers/:teamId/join/:token',
    currentUser,
    requireAuth,
    async (req: Request, res: Response) => {
        const { token, teamId } = req.params;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const teamMember = await TeamMember.findOne({
            where: {
                token: hashedToken,
                team_id: teamId,
            }
        });

        if (!teamMember) {
            throw new NotFoundError();
        }

        if (teamMember.dataValues.user_id !== +req.currentUser?.id! || req.currentUser?.role !== 'admin') {
            throw new NotAuthorizedError();
        }

        await teamMember.update({
            status: 'active',
            token: null,
            tokenExpire: null
        });

        await teamMember.save();

        res.status(201).send(teamMember.dataValues);
    });

router.delete('/api/teammembers/:teamId/reject/:token',
    currentUser,
    requireAuth,
    async (req: Request, res: Response) => {
        const { token, teamId } = req.params;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const teamMember = await TeamMember.findOne({
            where: {
                token: hashedToken,
                team_id: teamId
            }
        });

        if (!teamMember) {
            throw new NotFoundError();
        }

        if (teamMember.dataValues.user_id !== +req.currentUser?.id! || req.currentUser?.role !== 'admin') {
            throw new NotAuthorizedError();
        }

        await teamMember.destroy();

        res.status(201).send({ message: 'Request rejected!' });
    });

router.delete('/api/teammembers/:id',
    currentUser,
    requireAuth,
    requireAuthorize('admin'),
    async (req: Request, res: Response) => {
        const teamMember = await TeamMember.findByPk(req.params.id);

        if (!teamMember) {
            throw new NotFoundError();
        }

        await teamMember.destroy();

        res.status(204).send({ message: 'Successfully deleted' });
    });

export { router as teamsMembersRouter };