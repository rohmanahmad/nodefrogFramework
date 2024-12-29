import { NextFunction, Request, Response } from "express";

export default function (req: Request, res: Response, next: NextFunction) {
    try {
        next();
    } catch (err) {
        res.apiError({});
    }
}
