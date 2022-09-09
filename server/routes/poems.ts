import {
    Request,
    Response,
} from "express";

import {
    getPoem,
    returnPoems,
} from "../queries";
import express from "express";

const router = express.Router();

/* GET poems. */
router.get("/", async function (req: Request, res: Response) {
    const response = await returnPoems(10);
    res.send(response);
});

/* GET poems by ID. */
router.get("/:id", async function (req: Request, res: Response) {
    const response = await getPoem(Number(req.params.id));
    res.send(response);
});

export default router;
