import { roomIDToRoom } from "../modules/globals";
import { DrawingEditor, PoemEditor } from "../modules/editor";
import { DrawingRoom, PoemRoom } from "../modules/room";
import { Medium } from "../../src/types";

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
