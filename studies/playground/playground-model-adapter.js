// Formerly a separate reduced-form model. The playground now runs the shared
// MaMaMo model through browser-structural-model.js; these names are aliases.
export {
    runStructuralPlaygroundModel as runPlaygroundModel,
    getStructuralBaselineInputs as getPlaygroundBaselineInputs,
} from './browser-structural-model.js';
