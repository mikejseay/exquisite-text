import {
  NextFunction,
  Response,
  Request,
} from 'express';

import { express } from "../app";

const router = express.Router();

/* GET home page. */
router.get('/', function(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.render('index', { title: 'Express' });
  // res.send(req.body);
  // res.json({ title: 'Express' });
});

module.exports = router;
