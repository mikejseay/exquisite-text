import React from "react";

class TypewriterPoemOld extends React.PureComponent {
    data: Array<string>;
    unmounted: boolean;
    loopNum: number;
    period: number;
    isDeleting: boolean;
    text: string;

    constructor(data: Array<string>) {
        super(data);
        this.data = data;
        this.unmounted = false;
        this.loopNum = 0;
        this.period = 2000;
        this.isDeleting = false;

        this.text = "";

        this.tick = this.tick.bind(this);
    }

    componentDidMount() {
        this.unmounted = false;
        this.loopNum = 0;
        this.period = 2000;
        this.isDeleting = false;
        this.tick();
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    tick() {
        if (this.unmounted) {
            return;
        }

        const data = this.data;
        const i = this.loopNum % data.length;
        const fullTxt = data[i];

        let newText = "";
        if (this.isDeleting) {
            newText = fullTxt.substring(0, this.text.length - 1);
        } else {
            newText = fullTxt.substring(0, this.text.length + 1);
        }

        let delta = 200 - Math.random() * 100;

        if (this.isDeleting) {
            delta /= 2;
        }

        if (!this.isDeleting && newText === fullTxt) {
            delta = this.period;
            this.isDeleting = true;
        } else if (this.isDeleting && newText === "") {
            this.isDeleting = false;
            this.loopNum++;
            delta = 500;
        }

        this.setState({ text: newText });

        setTimeout(() => {
            this.tick();
        }, delta);
    }

    render() {
        return <span className="typewriter">{this.text}</span>;
    }
}

export default TypewriterPoemOld;
