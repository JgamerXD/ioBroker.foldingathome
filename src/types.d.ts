type FahDataType = {
    alive: boolean;
    options: FahOptionsType;
    slots: Array<FahSlotType>;
    queue: Array<FahWorkUnitType>;
};
type FahOptionsType = {
    user: string;
    team: string;
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
    id: string;
    state: string;
    error: string;
    project: number;
    run: number;
    clone: number;
    gen: number;
    core: string;
    unit: string;
    percentdone: number; // TODO: number
    eta: string; // TODO: duration/time
    ppd: number; // TODO: number
    creditestimate: number;
    waitingon: string;
    nextattempt: string; // TODO: duration/time
    timeremaining: string; // TODO: duration/time
    totalframes: number;
    framesdone: number;
    assigned: string; // Date | null;
    timeout: string; // Date | null;
    deadline: string; // Date | null;
    ws: string;
    cs: string;
    attempts: number;
    slot: string;
    tpf: string; // TODO: duration/time
    basecredit: number; // TODO: number
};

type ParsedPyONType = {
    isPyON: boolean;
    version?: string;
    command?: string;
    error: boolean;
    obj?: any;
};
