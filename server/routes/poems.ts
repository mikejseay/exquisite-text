import express, {
    Request,
    Response,
} from "express";

import { Line } from "../entity/line";

const router = express.Router();

/* GET all poems listing. */
router.get("/poems", function (req: express.Request, res: express.Response) {
    // res.send("respond with a resource");
    Line.findAll({
        group: [ "poemID", "addedAt" ],
    })
        .then((data) => {
            console.log(data);
            res.send(data);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send(err);
        });
});

/* GET a poem. */
router.get("/poems/:id", function (req: Request, res: Response) {
    const { id } = req.params;
    Line.findAll({
        where: {
            poemID: id,
        },
    })
        .then((poem) => {
            console.log(poem);
            res.send(poem);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send(err);
        });
});

export default router;
