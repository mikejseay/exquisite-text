import {
    Request,
    Response,
} from "express";

import {
    getPoem,
    returnPoems,
} from "../queries";
import express from "express";
import { nPoemsPerPage } from "../../src/constants";

const router = express.Router();

/* GET poems. */
// router.get("/", async function (req: Request, res: Response) {
//     const response = await returnPoems(nPoemsToFetch);
//     res.send(response);
// });

/* GET poems. */
router.get("/:offset", async function (req: Request, res: Response) {
    const response = await returnPoems(nPoemsPerPage, Number(req.params.offset));
    res.send(response);
});

/* GET poems by ID. */
// router.get("/:id", async function (req: Request, res: Response) {
//     const response = await getPoem(Number(req.params.id));
//     res.send(response);
// });

export default router;
