import {SyntaxError} from './types';
import {MarkerType} from './editor/types';


export function getMarkers(errors: Array<SyntaxError>): Array<MarkerType> {
    return errors.map((error: SyntaxError): MarkerType => {
        if (error.startLine) {
            return {
                startRow: error.startLine,
                endRow: error.endLine,
                startCol: error.startColumn,
                endCol: error.endColumn,
                severity: error.type || 'error',
                message: error.message
            };
        } else {
            return {
                startRow: 0,
                endRow: 0,
                startCol: 0,
                endCol: 0,
                severity: error.type || 'error',
                message: error.message
            };
        }
    });
}
