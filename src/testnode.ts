import FahConnection from "./FahConnection";
const dummy = {
    log: { ...console },
};
const fah = new FahConnection((dummy as unknown) as ioBroker.Logger, "localhost", 36330, "");
console.log(fah.connectionId);
