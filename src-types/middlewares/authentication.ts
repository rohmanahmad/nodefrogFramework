import { NextFunction, Request, Response } from "express";

export default function (req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.header("x-api-key") || req.query["x-token"];
        if (!token) throw new Error("The Token Required For This Endpoint");
        next();
    } catch (err) {
        res.status(402).send({
            statusCode: 402,
            message: "Bad Auth Token!",
            error: (err instanceof Error) ? err.message : "",
        });
    }
}
