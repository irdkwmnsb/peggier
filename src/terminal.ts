
export class StringTerminal {
  constructor(public value: string) {}
}

export class RegexpTerminal {
  constructor(public value: RegExp) {}
}

export type Terminal = StringTerminal | RegexpTerminal;


