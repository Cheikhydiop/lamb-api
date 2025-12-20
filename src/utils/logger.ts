import * as fs from 'fs';
import * as path from 'path';

const logDir = path.join(process.cwd());

class Logger {
  private ensureLogFiles() {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  private formatMeta(meta: any): string {
    if (!meta) return '';
    try {
      return ` ${JSON.stringify(meta)}`;
    } catch {
      return '';
    }
  }

  info(message: string, meta?: any) {
    this.ensureLogFiles();
    const formattedMessage = this.formatMessage('INFO', message) + this.formatMeta(meta);
    console.log(formattedMessage);
    fs.appendFileSync(path.join(logDir, 'combined.log'), formattedMessage + '\n');
  }

  error(message: string, error?: any, meta?: any) {
    this.ensureLogFiles();
    const formattedMessage = this.formatMessage('ERROR', message) + this.formatMeta(meta);
    console.error(formattedMessage);
    fs.appendFileSync(path.join(logDir, 'error.log'), formattedMessage + '\n');
    if (error) {
      fs.appendFileSync(path.join(logDir, 'error.log'), JSON.stringify(error, null, 2) + '\n');
    }
  }

  warn(message: string, meta?: any) {
    this.ensureLogFiles();
    const formattedMessage = this.formatMessage('WARN', message) + this.formatMeta(meta);
    console.warn(formattedMessage);
    fs.appendFileSync(path.join(logDir, 'combined.log'), formattedMessage + '\n');
  }

  debug(message: string, meta?: any) {
    if (process.env.DEBUG === 'true') {
      const formattedMessage = this.formatMessage('DEBUG', message) + this.formatMeta(meta);
      console.debug(formattedMessage);
      fs.appendFileSync(path.join(logDir, 'combined.log'), formattedMessage + '\n');
    }
  }
}

export default new Logger();
