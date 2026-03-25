import { textCentered } from "styles/common";

export default function NoResults({ message }: { message: string }): JSX.Element {
    return (
        <div style={textCentered}>
            <h4>{message}</h4>
        </div>
    );
}
