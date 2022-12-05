import { RegisterRoutes } from './routes/routes';
import { ValidateError } from 'tsoa';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';


const app = express();
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));


app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
        swaggerOptions: {
            url: '/swagger.json'
        }
    })
);

RegisterRoutes(app);
app.use(function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
): Response | void {
    if (err instanceof ValidateError) {
        // eslint-disable-next-line no-console
        console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
        return res.status(422).json({
            message: 'Validation Failed',
            details: err?.fields
        });
    }
    if (err instanceof Error) {
        // eslint-disable-next-line no-console
        console.log(err);

        return res.status(500).json({
            message: 'Internal Server Error'
        });
    }

    next();
});

export default app;