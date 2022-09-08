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

/* GET poems by ID. */
router.get("/:id", async function (req: Request, res: Response) {
    const response = Number(req.params.id) > 0
        ? await getPoem(Number(req.params.id))
        : await returnPoems(10);
    res.send(response);
});

export default router;
