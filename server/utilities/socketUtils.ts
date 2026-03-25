import type { Drawing, Poem } from "modules/collaboration";
import type { DrawingEditor, PoemEditor } from "modules/editor";
import { roomIDToRoom } from "modules/globals";
import type Host from "modules/host";
import type { DrawingRoom, PoemRoom } from "modules/room";
import type { DrawingSpectator, PoemSpectator } from "modules/spectator";
import { multipleDrawingsTestData } from "shared/data/multipleDrawings";
import { poemsLines as poemsLinesTestData } from "shared/data/multiplePoems";
import { GameState, Medium, Role } from "shared/types/types";
import type { TypedServer, TypedSocket } from "types";
import { logger } from "utilities/loggerUtils";

export function getRouteForGameStateAndRole(gameState: GameState, role: Role): string {
    if (gameState === GameState.LOBBY) {
        return "/lobby";
    } else if (gameState === GameState.END) {
        return "/end";
    } else if (gameState === GameState.GAME) {
        if (role === Role.EDITOR) {
            return "/game";
        } else if (role === Role.SPECTATOR) {
            return "/spectate";
        }
    }
    throw new Error("unknown game state / role in getRouteForGameStateAndRole");
}

export function getRoom(roomID: string | undefined): PoemRoom | DrawingRoom | undefined {
    if (!roomIDToRoom || !roomID) {
        logger.error("roomIDToRoom map or roomID is undefined");
        return undefined;
    }
    const room = roomIDToRoom.get(roomID);
    if (!room) {
        logger.error(`No room found for ID: ${roomID}`);
        return undefined;
    }
    return room;
}

export function getEditorSocketID(roomID: string | undefined, editorID: string | undefined): string | undefined {
    if (!roomIDToRoom || !roomID || !editorID) {
        logger.error("roomIDToRoom map or roomID or editorID is undefined");
        return undefined;
    }
    const room: PoemRoom | DrawingRoom | undefined = roomIDToRoom.get(roomID);
    if (!room || !room.editors) {
        logger.error(`Editors not found in the room or room not found for ID: ${roomID}`);
        return undefined;
    }
    const editor: PoemEditor | DrawingEditor | undefined = room.editors.get(editorID);
    if (!editor || !editor.socket) {
        logger.error(`PoemEditor or editor's socket not found for ID: ${editorID}`);
        return undefined;
    }
    return editor.socket.id;
}

export function standardReconnect(
    io: TypedServer,
    socket: TypedSocket,
    member: PoemEditor | PoemSpectator | DrawingEditor | DrawingSpectator | undefined,
) {
    if (member?.socket) {
        // send socket (tab) that's currently connected to the disconnected view
        logger.debug(`disconnecting previous socket for deviceID ${member.deviceID}`);
        io.to(member.socket.id).emit("stcNavigate", "/disconnected");
        member.socket.disconnect(); // force disconnect on original socket
        logger.debug(`connecting new socket for deviceID ${member.deviceID}`);
        member.socket = socket; // connect the new socket to same Member
        member.joinRoom(); // re-join the correct rooms
        logger.debug(`about to reinstate context for ${member.deviceID}`);
        member.reinstateContext();
    }
}

// only used to test the end screen, but we allow it to be parasitic for now
export function sendCompletedArtTestData(
    member: Host | PoemEditor | PoemSpectator | DrawingEditor | DrawingSpectator,
    testingMedium: Medium,
) {
    if (testingMedium === Medium.POETRY) {
        logger.debug("sending test poemsLines data in a way that is unusual");
        // poemsLinesTestData is an array of arrays of lines
        for (const linesArray of poemsLinesTestData) {
            member.io.to(member.socket.id).emit("stcPoemLines", linesArray);
        }
        return;
    } else if (testingMedium === Medium.DRAWING) {
        logger.debug("sending test drawing data in a way that is unusual");
        member.io.to(member.socket.id).emit("stcCompletedDrawings", multipleDrawingsTestData);
        return;
    }
}

export function sendCollaborationContributionsInfo(
    member: Host | PoemEditor | PoemSpectator | DrawingEditor | DrawingSpectator,
) {
    const room = roomIDToRoom.get(member.roomID);

    if (!room) {
        logger.debug("room not found");
        return;
    }
    logger.debug(`${member.name} request collaborations from room which has ${room.finishedWorks.length}`);

    if (room.medium === Medium.POETRY) {
        for (const collaborationObj of room.finishedWorks) {
            member.io.to(member.socket.id).emit("stcPoemLines", Array.from((collaborationObj as Poem).lines));
        }
    } else if (room.medium === Medium.DRAWING) {
        const completedDrawings = (room.finishedWorks as Drawing[]).map((drawing) =>
            Array.from(drawing.panels).map((panel) => panel.content),
        );
        member.io.to(member.socket.id).emit("stcCompletedDrawings", completedDrawings);
    }
}
