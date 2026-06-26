import { socket } from "components/SocketHandler/SocketHandler";
import { shortDur } from "constants/constants";
import type {
    IGameSettingsInfo,
    ILine,
    IPanel,
    ISocketInfoListeners,
    IUserTableInfo,
    Medium,
    Point,
} from "types/types";
import { logger } from "utilities/loggerUtils";

function updateAtIndex<T>(array: T[], index: number, value: T): T[] {
    return [...array.slice(0, index), value, ...array.slice(index + 1)];
}

export const socketListeners = ({
    setUserInfo,
    setPoemsLines,
    setJoinErrorMessage,
    setRoomCode,
    setSettingsEnabled,
    setBotEnabled,
    setLineLength,
    setNRounds,
    setNPoems,
    setNDrawings,
    setLines,
    setPanels,
    setPanelEdits,
    setLineEdits,
    setPoemInput,
    setPoemInputSpectate,
    setOnLastContribution,
    setEditorActive,
    navigate,
    setStrokeHistory,
    setCompletedDrawings,
    setMedium,
}: ISocketInfoListeners) => {
    // receivePoemsLinesListener
    const receivePoemsLines = (myPoemLines: ILine[]) => {
        setPoemsLines((prevPoemsLines) => {
            return [...prevPoemsLines, myPoemLines];
        });
    };

    const receiveUserTableInfo = (info: IUserTableInfo) => {
        setUserInfo(info);
    };

    const receiveJoinError = (errorMsg: string) => {
        setJoinErrorMessage(errorMsg);
        setTimeout(() => setJoinErrorMessage(""), shortDur);
    };

    // Event handlers for the line and the deleteLine events are set up for the Socket.IO connection.
    const receiveRoomCode = (info: string) => {
        setRoomCode(info);
    };

    const receiveGameSettingsInfo = (info: IGameSettingsInfo) => {
        setLineLength(info.lineLength);
        setNRounds(info.nRounds);
        setNPoems(info.nPoems);
        setNDrawings(info.nDrawings);
    };

    const receiveGameSettingsEnabled = (enabled: boolean) => {
        setSettingsEnabled(enabled);
    };

    const receiveBotEnabled = (enabled: boolean) => {
        setBotEnabled(enabled);
    };

    // the React state lines is of type Array<Array<ILine["content"]>>
    // this is because each line is of type ILine["content"]
    // each collaboration is of type Array<ILine["content"]>
    // and thus all the lines together for all collaborations is Array<Array<ILine["content"]>>
    const receiveLineSpectator = (collaborationIndex: number, content: ILine["content"]) => {
        setLines((prevLines) =>
            updateAtIndex(prevLines, collaborationIndex, [...prevLines[collaborationIndex], content]),
        );
    };

    const receivePanelSpectator = (collaborationIndex: number, content: IPanel["content"]) => {
        setPanelEdits((prevPanelEdits) => updateAtIndex(prevPanelEdits, collaborationIndex, []));
        setPanels((prevPanels) =>
            updateAtIndex(prevPanels, collaborationIndex, [...prevPanels[collaborationIndex], content]),
        );
    };

    const receivePanelEditSpectator = (collaborationIndex: number, content: IPanel["content"]) => {
        logger.debug(`receivePanelEditSpectator ${collaborationIndex} ${content}`);
        setPanelEdits((prevPanelEdits) => updateAtIndex(prevPanelEdits, collaborationIndex, content));
    };

    const receiveLineEditSpectator = (poemIndex: number, value: string) => {
        setLineEdits((prevLineEdits) => updateAtIndex(prevLineEdits, poemIndex, value));
    };

    const receiveLineEdit = (lineEdit: string) => {
        setPoemInput(lineEdit);
    };

    const receiveLineEditorWatch = (lineEditorWatchVal: string) => {
        setPoemInputSpectate(lineEditorWatchVal);
    };

    const receiveLastContribution = (lastLine: boolean) => {
        setOnLastContribution(lastLine);
    };

    const receiveEditorActive = (editorActiveFromServer: boolean) => {
        logger.debug(`receiveEditorActive: ${editorActiveFromServer}`);
        setEditorActive(editorActiveFromServer);
    };

    const receiveNavigate = (targetRoute: string) => {
        logger.debug(`receiveNavigate activated targeting ${targetRoute}`);
        navigate(targetRoute);
    };

    // receivePanel, as it were ;)
    const receiveStrokeHistory = (strokeHistory: Point[][]) => {
        logger.debug(`receiveStrokeHistory activated targeting ${JSON.stringify(strokeHistory)}`);
        setStrokeHistory(strokeHistory);
    };

    // Outermost array contains drawings Point[][][]
    // Drawings contain panels Point[][]
    // Panels contain vectorized stroke histories Point[]
    const receiveCompletedDrawings = (completedDrawings: Point[][][][]) => {
        setCompletedDrawings(completedDrawings);
    };

    const receiveMedium = (medium: Medium) => {
        logger.debug(`receiveMedium: ${medium}`);
        setMedium(medium);
    };

    socket.on("stcPoemLines", receivePoemsLines);
    socket.on("stcUserTableInfo", receiveUserTableInfo);
    socket.on("stcJoinError", receiveJoinError);
    socket.on("stcRoomCode", receiveRoomCode);
    socket.on("stcGameSettingsInfo", receiveGameSettingsInfo);
    socket.on("stcGameSettingsEnabled", receiveGameSettingsEnabled);
    socket.on("stcBotEnabled", receiveBotEnabled);
    socket.on("stcLineSpectator", receiveLineSpectator);
    socket.on("stcPanelSpectator", receivePanelSpectator);
    socket.on("stcPanelEditSpectator", receivePanelEditSpectator);
    socket.on("stcLineEditSpectator", receiveLineEditSpectator);
    socket.on("stcLineEdit", receiveLineEdit);
    socket.on("stcLineEditorWatch", receiveLineEditorWatch);
    socket.on("stcLastContribution", receiveLastContribution);
    socket.on("stcEditorActive", receiveEditorActive);
    socket.on("stcNavigate", receiveNavigate);
    socket.on("stcStrokeHistory", receiveStrokeHistory);
    socket.on("stcCompletedDrawings", receiveCompletedDrawings);
    socket.on("stcMedium", receiveMedium);

    return () => {
        socket.off("stcPoemLines", receivePoemsLines);
        socket.off("stcUserTableInfo", receiveUserTableInfo);
        socket.off("stcJoinError", receiveJoinError);
        socket.off("stcRoomCode", receiveRoomCode);
        socket.off("stcGameSettingsInfo", receiveGameSettingsInfo);
        socket.off("stcGameSettingsEnabled", receiveGameSettingsEnabled);
        socket.off("stcBotEnabled", receiveBotEnabled);
        socket.off("stcLineSpectator", receiveLineSpectator);
        socket.off("stcPanelSpectator", receivePanelSpectator);
        socket.off("stcPanelEditSpectator", receivePanelEditSpectator);
        socket.off("stcLineEditSpectator", receiveLineEditSpectator);
        socket.off("stcLineEdit", receiveLineEdit);
        socket.off("stcLineEditorWatch", receiveLineEditorWatch);
        socket.off("stcLastContribution", receiveLastContribution);
        socket.off("stcEditorActive", receiveEditorActive);
        socket.off("stcNavigate", receiveNavigate);
        socket.off("stcStrokeHistory", receiveStrokeHistory);
        socket.off("stcCompletedDrawings", receiveCompletedDrawings);
        socket.off("stcMedium", receiveMedium);
    };
};
