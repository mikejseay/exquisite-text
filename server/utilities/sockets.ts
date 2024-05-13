import Editor from "../modules/editor";
import { roomIDToRoom } from "../modules/globals";
import Room from "../modules/room";

export function getRoom(roomID: string | undefined): Room | undefined {
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
    const room: Room | undefined = roomIDToRoom.get(roomID);
    if (!room || !room.editors) {
        console.error("Editors not found in the room or room not found for ID:", roomID);
        return undefined;
    }
    const editor: Editor | undefined = room.editors.get(editorID);
    if (!editor || !editor.socket) {
        console.error("Editor or editor's socket not found for ID:", editorID);
        return undefined;
    }
    return editor.socket.id;
}
