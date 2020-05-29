export class PreferenceService {
    get(key: string): string | null {
        return localStorage.getItem(key);
    }

    put(key: string, value: string) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error(`unable to setItem ${key} in localStorage`, e);
        }
    }

    remove(key: string) {
        localStorage.removeItem(key);
    }
}
