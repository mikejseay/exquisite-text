import { roomIDToRoom } from "../modules/globals";
import { DrawingEditor, PoemEditor } from "../modules/editor";
import { DrawingRoom, PoemRoom } from "../modules/room";
import { Server, Socket } from "socket.io";
import {
    ClientToServerEvents,
    GameState,
    InterServerEvents,
    Role,
    ServerToClientEvents,
    SocketData,
} from "../../src/types";
import { DrawingSpectator, PoemSpectator } from "../modules/spectator";
import { poemsLines as poemsLinesTestData } from "../../src/data/multiplePoems";
import Host from "../modules/host";
import { Drawing, Poem } from "../modules/collaboration";


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
        console.error("roomIDToRoom map or roomID is undefined");
        return undefined;
    }
    const room = roomIDToRoom.get(roomID);
    if (!room) {
        console.error("No room found for ID:", roomID);
        return undefined;
    }
    return room;
}

export function getEditorSocketID(roomID: string | undefined, editorID: string | undefined): string | undefined {
    if (!roomIDToRoom || !roomID || !editorID) {
        console.error("roomIDToRoom map or roomID or editorID is undefined");
        return undefined;
    }
    const room: PoemRoom | DrawingRoom | undefined = roomIDToRoom.get(roomID);
    if (!room || !room.editors) {
        console.error("Editors not found in the room or room not found for ID:", roomID);
        return undefined;
    }
    const editor: PoemEditor | DrawingEditor | undefined = room.editors.get(editorID);
    if (!editor || !editor.socket) {
        console.error("PoemEditor or editor's socket not found for ID:", editorID);
        return undefined;
    }
    return editor.socket.id;
}


export function standardReconnect(
    io: Server<ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData>,
    socket: Socket,
    member: PoemEditor | PoemSpectator | DrawingEditor | DrawingSpectator | undefined,
) {
    if (member && member.socket) {
        // send socket (tab) that's currently connected to the disconnected view
        console.log("disconnecting previous socket for deviceID", member.deviceID);
        io.to(member.socket.id).emit("stcNavigate", "/disconnected");
        member.socket.disconnect(); // force disconnect on original socket
        console.log("connecting new socket for deviceID", member.deviceID);
        member.socket = socket; // connect the new socket to same Member
        member.joinRoom(); // re-join the correct rooms
        console.log("about to reinstate context for", member.deviceID);
        member.reinstateContext();
    }
}

// only used to test the end screen, but we allow it to be parasitic for now
export function sendCollaborationContributionsInfo(member: Host | PoemEditor | PoemSpectator | DrawingEditor | DrawingSpectator, shouldTest: boolean) {
    const room = roomIDToRoom.get(member.roomID);

    if (shouldTest) {
        console.log("sending test poemsLines data in a way that is unusual");
        // poemsLinesTestData is an array of arrays of lines
        for (const linesArray of poemsLinesTestData) {
            member.io
                .to(member.socket.id)
                .emit(
                    "stcPoemLines",
                    linesArray,
                );
        }
        return;
    }

    if (!room) {
        console.log("room not found");
        return;
    }
    console.log(member.name, "request collaborations from room which has", room.finishedWorks.length);
    for (const collaborationObj of room.finishedWorks) {
        // TODO: Explore this, this could improve server-side efficiency:
        // poemMember.io.in(poemMember.roomID).emit("stcPoemLines", Array.from(poemObj.lines));
        if ("lines" in collaborationObj) {
            member.io
                .to(member.socket.id)
                .emit(
                    "stcPoemLines",
                    Array.from((collaborationObj as Poem).lines),
                );
        } else {
            member.io
                .to(member.socket.id)
                .emit(
                    "stcDrawingPanels",
                    Array.from((collaborationObj as Drawing).panels),
                );
        }
    }
}
