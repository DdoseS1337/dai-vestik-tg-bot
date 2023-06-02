import { config, DotenvParseOutput } from "dotenv";
import { IConfigService } from "./config.interface";

export class ConfigService implements IConfigService {
  private config: DotenvParseOutput;
  constructor() {
    const { error, parsed } = config();
	if(error) {
		throw new Error("Файл не знайдено")
	}
	if(!parsed) {
		throw new Error("Пустий файл")
	}
	this.config = parsed;
  }

  get(key: string): string {
	const res = this.config[key];
	if(!res) {
		throw new Error("Нема ключа")
	}
	return res;
  }
}
