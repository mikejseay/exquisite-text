import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import * as React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";

import { useSocket } from "../App";
import {
    poemTitle,
    poemsBody,
} from "./styles";

import {
    ILine,
    IUserTableInfo,
} from "../../types";
import PoemLines from "../PoemLines";
import PoemLinesAnimated from "../PoemLinesAnimated";

function MultiplePoems() {
    const { socket } = useSocket();
    const [ poemsLines, setPoemsLines ] = React.useState<Array<ILine[]>>([]);
    const [ userInfo, setUserInfo ] = React.useState<IUserTableInfo>({} as IUserTableInfo);

    React.useEffect(() => {

        socket.emit("getUserTableInfo");

        const poemsLinesListener = (myPoemLines: ILine[]) => {
            setPoemsLines(prevPoemsLines => {
                return [ ...prevPoemsLines, myPoemLines ];
            });
        };

        const userTableInfoListener = (info: IUserTableInfo) => {
            setUserInfo(info);
            socket.off("userTableInfo", userTableInfoListener);
        };

        socket.on("poemLines", poemsLinesListener);
        socket.on("userTableInfo", userTableInfoListener);

        setPoemsLines([]);
        socket.emit("getPoemsLines");

        return () => {
            socket.off("poemLines", poemsLinesListener);
            socket.off("userTableInfo", userTableInfoListener);
        };
    }, [ socket ]);

    const renderPoems = () => {
        return poemsLines.map((poemLines, poemLinesIndex) => (
            <Accordion
                defaultExpanded={true}
                expanded={true}
                key={poemLinesIndex}
            >
                <AccordionSummary
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <div style={poemTitle} className={"poem-title"}>
                        <strong>{`exquisite text #${poemLinesIndex}`}</strong>
                    </div>
                </AccordionSummary>
                <AccordionDetails>
                    {/*<PoemLinesAnimated poemLines={poemLines} userInfo={userInfo} />*/}
                    <PoemLines poemLines={poemLines} userInfo={userInfo} />
                </AccordionDetails>
            </Accordion>
        ));
    };

    console.log(poemsLines);
    console.log(userInfo);

    return (
        <div className={"poems-with-lines"} style={poemsBody}>
            {poemsLines.length > 1
                ? <Carousel>{renderPoems()}</Carousel>
                : renderPoems()}
        </div>
    );
}

export default MultiplePoems;
