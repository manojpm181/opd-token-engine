export class Doctor {
  constructor(
    public readonly id: string,
    public name: string,
    public specialization?: string,
    public isActive: boolean = true
  ) {}
}
