import { socket } from "../components/SocketHandler";
import { IGameSettingsInfo, ILine, IPanel, ISocketInfoListeners, IUserTableInfo, Medium, Point } from "../types";
import { shortDur } from "../constants";

export const socketListeners = ({
    setUserInfo,
    setPoemsLines,
    setJoinErrorMessage,
    setRoomCode,
    setSettingsEnabled,
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
        setPoemsLines(prevPoemsLines => {
            return [ ...prevPoemsLines, myPoemLines ];
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
        setLineLength(info["lineLength"]);
        setNRounds(info["nRounds"]);
        setNPoems(info["nPoems"]);
        setNDrawings(info["nDrawings"]);
    };

    const receiveGameSettingsEnabled = (enabled: boolean) => {
        setSettingsEnabled(enabled);
    };

    const receiveLineSpectator = (collaborationIndex: number, content: ILine["content"]) => {
        setLines(prevLines => {
            return [ ...prevLines.slice(0, collaborationIndex), [ ...prevLines[collaborationIndex], content ], ...prevLines.slice(collaborationIndex + 1) ];
        },
        );
    };

    const receivePanelSpectator = (collaborationIndex: number, content: IPanel["content"]) => {
        setPanels((prevPanels) => {
            const panelsToSet = [ ...prevPanels.slice(0, collaborationIndex), [ ...prevPanels[collaborationIndex], content ], ...prevPanels.slice(collaborationIndex + 1) ];
            console.log({ panelsToSet });
            return panelsToSet;
        });
    };

    const receivePanelEditSpectator = (collaborationIndex: number, content: IPanel["content"]) => {
        setPanelEdits(prevPanelEdits => [
            ...prevPanelEdits.slice(0, collaborationIndex),
            content,
            ...prevPanelEdits.slice(collaborationIndex + 1),
        ]);
    };

    const receiveLineEditSpectator = (poemIndex: number, value: string) => {
        setLineEdits(prevLineEdits => [
            ...prevLineEdits.slice(0, poemIndex),
            value,
            ...prevLineEdits.slice(poemIndex + 1),
        ]);
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
        console.log("receiveEditorActive:", { editorActiveFromServer });
        setEditorActive(editorActiveFromServer);
    };

    const receiveNavigate = (targetRoute: string) => {
        console.log("receiveNavigate activated targeting", targetRoute);
        navigate(targetRoute);
    };

    // receivePanel, as it were ;)
    const receiveStrokeHistory = (strokeHistory: Point[][]) => {
        console.log("receiveStrokeHistory activated targeting", JSON.stringify(strokeHistory));
        setStrokeHistory(strokeHistory);
    };

    // Outermost array contains drawings Point[][][]
    // Drawings contain panels Point[][]
    // Panels contain vectorized stroke histories Point[]
    const receiveCompletedDrawings = (completedDrawings: Point[][][][]) => {
        setCompletedDrawings(completedDrawings);
    };

    const receiveMedium = (medium: Medium) => {
        console.log("receiveMedium:", medium);
        setMedium(medium);
    };

    socket.on("stcPoemLines", receivePoemsLines);
    socket.on("stcUserTableInfo", receiveUserTableInfo);
    socket.on("stcJoinError", receiveJoinError);
    socket.on("stcRoomCode", receiveRoomCode);
    socket.on("stcGameSettingsInfo", receiveGameSettingsInfo);
    socket.on("stcGameSettingsEnabled", receiveGameSettingsEnabled);
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
