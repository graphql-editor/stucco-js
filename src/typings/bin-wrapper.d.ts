declare module "bin-wrapper" {
	interface Options {
		skipCheck?: boolean
	}
	class BinWrapper{
		constructor(options?: Options)
		src(arg1: string, arg2?:string, arg3?:string): BinWrapper
		src(): string
		dest(arg1: string): BinWrapper
		dest(): string
		use(arg1: string): BinWrapper
		use(): string
		run(args?: string[]): Promise<any>
		path(): string
		version(arg1: string): BinWrapper
		version(): string
	}
	export = BinWrapper
}
