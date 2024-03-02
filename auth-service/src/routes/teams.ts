import express, { Request, Response } from 'express';
import { body } from 'express-validator';

import { Team } from '../models/team';
import { currentUser } from '../middlewares/current-user';
import { requireAuth } from '../middlewares/require-auth';
import { BadRequestError } from '../errors/bad-request-error';
import { validateRequest } from '../middlewares/validate-request';
import { requireAuthorize } from '../middlewares/require-authorize';
import { NotFoundError } from '../errors/not-found-error';

const router = express.Router();

router.get('/api/teams', currentUser, requireAuth, requireAuthorize('admin'), async (req: Request, res: Response) => {
    const teams = await Team.findAll();

    res.status(200).send(teams);
});

router.get('/api/teams/:id', currentUser, requireAuth, async (req: Request, res: Response) => {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
        throw new NotFoundError();
    }

    res.status(200).send(team);
});

router.post('/api/teams',
    currentUser,
    requireAuth,
    requireAuthorize('admin'),
    [
        body('name')
            .notEmpty()
            .withMessage('Team name is required'),
        body('category')
            .notEmpty()
            .withMessage('Team category is required')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        const { name, category } = req.body;

        const existingTeam = await Team.findOne({
            where: {
                name
            }
        });

        if (existingTeam) {
            throw new BadRequestError('Team name in use');
        }

        const team = Team.build({ name, category });
        await team.save();

        res.status(201).send(team);
    });

router.patch('/api/teams/:id',
    currentUser,
    requireAuth,
    requireAuthorize('admin'),
    async (req: Request, res: Response) => {
        const { name, category } = req.body;
        const { id } = req.params;

        const team = await Team.findOne({
            where: {
                id
            }
        });

        if (!team) {
            throw new NotFoundError();
        }

        await team.update({
            ...team.dataValues,
            name,
            category
        });
        await team.save();

        res.status(201).send(team.dataValues);
    });

router.delete('/api/teams/:id',
    currentUser,
    requireAuth,
    requireAuthorize('admin'),
    async (req: Request, res: Response) => {
        const team = await Team.findByPk(req.params.id);

        if (!team) {
            throw new NotFoundError();
        }

        await team.destroy();

        res.status(204).send({ message: 'Successfully deleted' });
    });

export { router as teamsRouter };