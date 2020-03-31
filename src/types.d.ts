type FahDataType = {
    alive: boolean;
    options: FahOptionsType;
    slots: Array<FahSlotType>;
    queue: Array<FahWorkUnitType>;
};
type FahOptionsType = {
    user: string;
    team: string; // number
    cause: string;
    power: string;
};
type FahSlotType = {
    id: string;
    status: string;
    description: string;
    options: {
        paused?: boolean;
        idle?: boolean;
    };
    reason: string;
    idle: boolean;
};
type FahWorkUnitType = {
    id: string; // TODO: number
    state: string;
    error: string;
    project: number;
    run: number;
    clone: number;
    gen: number;
    core: string;
    unit: string;
    percentdone: string; // TODO: number
    eta: string; // TODO: duration/time
    ppd: string; // TODO: number
    creditestimate: string; // TODO: number
    waitingon: string;
    nextattempt: string; // TODO: duration/time
    timeremaining: string; // TODO: duration/time
    totalframes: number;
    framesdone: number;
    assigned: string; // TODO: time
    timeout: string; // TODO: time
    deadline: string; // TODO: time
    ws: string;
    cs: string;
    attempts: number;
    slot: string;
    tpf: string; // TODO: duration/time
    basecredit: string; // TODO: number
};
type ParsedPyONType = {
    isPyON: boolean;
    version?: string;
    command?: string;
    error: boolean;
    obj?: any;
};
