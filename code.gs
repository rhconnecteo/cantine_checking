// ==================== CONFIGURATION ====================
const SPREADSHEET_ID = '1q5S-tv8hA3_uzjnFJ6MPvqfYLBB2t0P3F5R0tNm0Okk';
const SHEET_NAME = 'Cantine';

const TOTAL_COLUMNS = 54;
const SIMPLE_RAJOUT_INDEX = 51;
const NEW_COLLABORATOR_INDEX = 52;
const AVATAR_INDEX = 53;

// INDEX CORRIGÉS - Vérification pour dimanche
// Structure des colonnes (index 0-based):
// A0: Matricule, B1: Nom, C2: Planning Lundi, D3: Shift Lundi, E4: Choix Lundi, F5: Attribution Lundi, G6: Rajout Lundi, H7: Checking Lundi, I8: Heure Lundi
// J9: Planning Mardi, K10: Shift Mardi, L11: Choix Mardi, M12: Attribution Mardi, N13: Rajout Mardi, O14: Checking Mardi, P15: Heure Mardi
// Q16: Planning Mercredi, R17: Shift Mercredi, S18: Choix Mercredi, T19: Attribution Mercredi, U20: Rajout Mercredi, V21: Checking Mercredi, W22: Heure Mercredi
// X23: Planning Jeudi, Y24: Shift Jeudi, Z25: Choix Jeudi, AA26: Attribution Jeudi, AB27: Rajout Jeudi, AC28: Checking Jeudi, AD29: Heure Jeudi
// AE30: Planning Vendredi, AF31: Shift Vendredi, AG32: Choix Vendredi, AH33: Attribution Vendredi, AI34: Rajout Vendredi, AJ35: Checking Vendredi, AK36: Heure Vendredi
// AL37: Planning Samedi, AM38: Shift Samedi, AN39: Choix Samedi, AO40: Attribution Samedi, AP41: Rajout Samedi, AQ42: Checking Samedi, AR43: Heure Samedi
// AS44: Planning Dimanche, AT45: Shift Dimanche, AU46: Choix Dimanche, AV47: Attribution Dimanche, AW48: Rajout Dimanche, AX49: Checking Dimanche, AY50: Heure Dimanche
// AZ51: Simple rajout, BA52: Nouveau Collaborateur, BB53: Photo

const DAY_CONFIG = [
	{ key: 'lundi', label: 'Lundi', planningIndex: 2, periodIndex: 3, choiceIndex: 4, attributionIndex: 5, rajoutIndex: 6, checkingIndex: 7, timeIndex: 8 },
	{ key: 'mardi', label: 'Mardi', planningIndex: 9, periodIndex: 10, choiceIndex: 11, attributionIndex: 12, rajoutIndex: 13, checkingIndex: 14, timeIndex: 15 },
	{ key: 'mercredi', label: 'Mercredi', planningIndex: 16, periodIndex: 17, choiceIndex: 18, attributionIndex: 19, rajoutIndex: 20, checkingIndex: 21, timeIndex: 22 },
	{ key: 'jeudi', label: 'Jeudi', planningIndex: 23, periodIndex: 24, choiceIndex: 25, attributionIndex: 26, rajoutIndex: 27, checkingIndex: 28, timeIndex: 29 },
	{ key: 'vendredi', label: 'Vendredi', planningIndex: 30, periodIndex: 31, choiceIndex: 32, attributionIndex: 33, rajoutIndex: 34, checkingIndex: 35, timeIndex: 36 },
	{ key: 'samedi', label: 'Samedi', planningIndex: 37, periodIndex: 38, choiceIndex: 39, attributionIndex: 40, rajoutIndex: 41, checkingIndex: 42, timeIndex: 43 },
	{ key: 'dimanche', label: 'Dimanche', planningIndex: 44, periodIndex: 45, choiceIndex: 46, attributionIndex: 47, rajoutIndex: 48, checkingIndex: 49, timeIndex: 50 },
];

function normalizeHeader_(value) {
	return String(value || '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/&/g, ' et ')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function findHeaderIndex_(headers, candidates, fallbackIndex) {
	const normalizedHeaders = headers.map((header) => normalizeHeader_(header));
	const normalizedCandidates = candidates.map((candidate) => normalizeHeader_(candidate));
	const index = normalizedHeaders.findIndex((header) => normalizedCandidates.includes(header));
	return index >= 0 ? index : fallbackIndex;
}

function resolveSheetConfig_(values) {
	const headers = Array.isArray(values) && values.length ? values[0] : [];
	const dayConfig = DAY_CONFIG.map((day) => ({
		...day,
		planningIndex: findHeaderIndex_(headers, [`Planning ${day.label}`], day.planningIndex),
		periodIndex: findHeaderIndex_(headers, [`Shift ${day.label}`], day.periodIndex),
		choiceIndex: findHeaderIndex_(headers, [`Choix du ${day.label}`, `Choix ${day.label}`], day.choiceIndex),
		attributionIndex: findHeaderIndex_(headers, [`Attribution ${day.label}`], day.attributionIndex),
		rajoutIndex: findHeaderIndex_(headers, [`Rajout ${day.label}`], day.rajoutIndex),
		checkingIndex: findHeaderIndex_(headers, [`Checking ${day.label}`], day.checkingIndex),
		timeIndex: findHeaderIndex_(headers, [`Heure de pointage ${day.label}`], day.timeIndex),
	}));

	return {
		dayConfig,
		simpleRajoutIndex: findHeaderIndex_(headers, ['Simple rajout'], SIMPLE_RAJOUT_INDEX),
		newCollaboratorIndex: findHeaderIndex_(headers, ['Nouveau Collaborateur'], NEW_COLLABORATOR_INDEX),
		avatarIndex: findHeaderIndex_(headers, ['Photo'], AVATAR_INDEX),
	};
}

function doGet(e) {
	if (e && e.method === 'OPTIONS') {
		return handleCorsPreflight();
	}

	const params = (e && e.parameter) || {};
	const wantsJson = String(params.format || '').toLowerCase() === 'json';
	const wantsBridge = String(params.format || '').toLowerCase() === 'bridge';
	const callback = String(params.callback || '').trim();
	const action = String(params.action || '').trim();
	const includeImages = String(params.includeImages || '').toLowerCase() === 'true';

	function createResponse(data, isJsonp = false, callbackName = '') {
		let output;
		let mimeType;
		
		if (isJsonp && callbackName && callbackName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
			output = ContentService.createTextOutput(`${callbackName}(${JSON.stringify(data)});`);
			mimeType = ContentService.MimeType.JAVASCRIPT;
		} else {
			output = ContentService.createTextOutput(JSON.stringify(data));
			mimeType = ContentService.MimeType.JSON;
		}
		
		output.setMimeType(mimeType);
		return output;
	}

	if (action === 'rajoutAdd') {
		try {
			const payload = addRajoutRow(params);
			return createResponse(payload, !!callback, callback);
		} catch (error) {
			return createResponse({ success: false, error: error.toString(), message: 'Erreur lors de l\'enregistrement du rajout' }, !!callback, callback);
		}
	}

	if (action === 'attributionAdd') {
		try {
			const payload = addAttributionRow(params);
			return createResponse(payload, !!callback, callback);
		} catch (error) {
			return createResponse({ success: false, error: error.toString(), message: 'Erreur lors de l\'enregistrement de l\'attribution' }, !!callback, callback);
		}
	}

	if (action === 'addCollaborator') {
		try {
			const payload = addCollaboratorRow(params);
			return createResponse(payload, !!callback, callback);
		} catch (error) {
			return createResponse({ success: false, error: error.toString(), message: 'Erreur lors de l\'ajout du collaborateur' }, !!callback, callback);
		}
	}

	if (action === 'markMealTaken') {
		try {
			const payload = markMealTaken(params);
			return createResponse(payload, !!callback, callback);
		} catch (error) {
			return createResponse({ success: false, error: error.toString(), message: 'Erreur lors de la prise du repas' }, !!callback, callback);
		}
	}

	if (wantsJson || callback) {
		try {
			const payload = getDashboardData(includeImages);
			return createResponse(payload, !!callback, callback);
		} catch (error) {
			return createResponse({ error: error.toString(), rows: [], totalRows: 0, noPlanningCount: 0, noChoiceCount: 0, simpleRajoutCount: 0, newCollaboratorCount: 0, rajoutCount: 0, days: DAY_CONFIG.map(({ key, label }) => ({ key, label })) }, !!callback, callback);
		}
	}

	if (wantsBridge) {
		try {
			const payload = getDashboardData(includeImages);
			return createBridgeResponse(payload);
		} catch (error) {
			return createBridgeResponse({ error: error.toString(), rows: [], totalRows: 0, noPlanningCount: 0, noChoiceCount: 0, simpleRajoutCount: 0, newCollaboratorCount: 0, rajoutCount: 0, days: DAY_CONFIG.map(({ key, label }) => ({ key, label })) });
		}
	}

	return HtmlService.createHtmlOutputFromFile('index').setTitle('Cantine Connecteo').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function handleCorsPreflight() {
	const output = ContentService.createTextOutput('');
	output.setMimeType(ContentService.MimeType.TEXT);
	return output;
}

function createBridgeResponse(data) {
	const safeJson = JSON.stringify(data).replace(/</g, '\\u003c');
	const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.parent.postMessage({type:'cantine-bridge-data',payload:${safeJson}},'*');</script></body></html>`;
	return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDashboardData(includeImages) {
	const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
	if (!sheet) throw new Error('Feuille introuvable: ' + SHEET_NAME);

	const values = sheet.getDataRange().getDisplayValues();
	const sheetConfig = resolveSheetConfig_(values);
	const dayConfig = sheetConfig.dayConfig;
	const rajoutIndex = buildRajoutIndex_(values, dayConfig);

	if (values.length <= 1) {
		return { rows: [], totalRows: 0, noPlanningCount: 0, noChoiceCount: 0, simpleRajoutCount: 0, newCollaboratorCount: 0, rajoutCount: 0, days: dayConfig.map(({ key, label }) => ({ key, label })) };
	}

	const rows = values.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== '')).map((row) => ({
		matricule: row[0] || '',
		nomPrenom: row[1] || '',
		days: dayConfig.reduce((accumulator, day) => {
			accumulator[day.key] = {
				planning: row[day.planningIndex] || '',
				period: row[day.periodIndex] || '',
				choice: row[day.choiceIndex] || '',
				attribution: day.attributionIndex == null ? '' : (row[day.attributionIndex] || ''),
				rajout: row[day.rajoutIndex] || '',
				checking: row[day.checkingIndex] || '',
				heurePointage: row[day.timeIndex] || '',
				isChecked: String(row[day.checkingIndex] || '').trim().toUpperCase() === 'X',
			};
			return accumulator;
		}, {}),
		imageBase64: includeImages ? (row[sheetConfig.avatarIndex] || '') : '',
		isSimpleRajout: normalizeKey_(row[sheetConfig.simpleRajoutIndex]) === 'x',
		isAddedCollaborator: normalizeKey_(row[sheetConfig.newCollaboratorIndex]) === 'x',
		rajouts: rajoutIndex[normalizeKey_(row[0])] || {},
	}));

	const summary = getSummaryCounts_(rows, dayConfig);
	return { rows, totalRows: rows.length, noPlanningCount: summary.noPlanningCount, noChoiceCount: summary.noChoiceCount, simpleRajoutCount: summary.simpleRajoutCount, newCollaboratorCount: summary.newCollaboratorCount, rajoutCount: summary.simpleRajoutCount, days: dayConfig.map(({ key, label }) => ({ key, label })) };
}

function addRajoutRow(params) {
	const matricule = String(params.matricule || '').trim();
	const jourKeys = normalizeDayList_(params.jours || params.jour || params.day || params.dayKey || '');

	if (!matricule) throw new Error('Matricule obligatoire.');
	if (!jourKeys.length) throw new Error('Jour invalide.');

	const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
	if (!sheet) throw new Error('Feuille introuvable: ' + SHEET_NAME);

	const values = sheet.getDataRange().getValues();
	const sheetConfig = resolveSheetConfig_(values);
	const dayConfig = sheetConfig.dayConfig;
	let targetRow = -1;

	for (let i = 1; i < values.length; i++) {
		if (normalizeKey_(values[i][0]) === normalizeKey_(matricule)) {
			targetRow = i + 1;
			break;
		}
	}

	if (targetRow < 0) throw new Error('Matricule introuvable.');

	const row = values[targetRow - 1] || [];
	// Pour un rajout simple, on marque la colonne "Simple rajout" (AZ)
	const markerIndex = sheetConfig.simpleRajoutIndex;

	jourKeys.forEach((jourKey) => {
		const day = dayConfig.find((item) => item.key === jourKey);
		if (day) {
			// Marquer la colonne Rajout du jour correspondant
			sheet.getRange(targetRow, day.rajoutIndex + 1).setValue('X');
		}
	});

	// Marquer la colonne "Simple rajout"
	sheet.getRange(targetRow, markerIndex + 1).setValue('X');
	
	const refreshedSummary = getDashboardData(false);

	return { success: true, message: 'Rajout simple enregistré.', jours: jourKeys, simpleRajoutCount: refreshedSummary.simpleRajoutCount, newCollaboratorCount: refreshedSummary.newCollaboratorCount, rajoutCount: refreshedSummary.simpleRajoutCount, updated: true };
}

function addAttributionRow(params) {
	const matriculeSource = String(params.matricule || '').trim();
	const matriculeCible = String(params.attribution || '').trim();
	const jourKeys = normalizeDayList_(params.jours || params.jour || params.day || params.dayKey || '');

	if (!matriculeSource) throw new Error('Matricule source obligatoire.');
	if (!matriculeCible) throw new Error('Collaborateur attributaire obligatoire.');
	if (normalizeKey_(matriculeSource) === normalizeKey_(matriculeCible)) throw new Error('Le repas doit etre attribue a un autre collaborateur.');
	if (!jourKeys.length) throw new Error('Jour invalide.');

	const lock = LockService.getScriptLock();
	lock.waitLock(5000);
	try {
		const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
		if (!sheet) throw new Error('Feuille introuvable: ' + SHEET_NAME);

		const values = sheet.getDataRange().getValues();
		const sheetConfig = resolveSheetConfig_(values);
		const dayConfig = sheetConfig.dayConfig;
		let sourceRow = -1;
		let targetExists = false;

		for (let i = 1; i < values.length; i++) {
			const rowMatricule = normalizeKey_(values[i][0]);
			if (rowMatricule === normalizeKey_(matriculeSource)) sourceRow = i + 1;
			if (rowMatricule === normalizeKey_(matriculeCible)) targetExists = true;
		}

		if (sourceRow < 0) throw new Error('Matricule source introuvable.');
		if (!targetExists) throw new Error('Collaborateur attributaire introuvable.');

		const updatedDays = [];
		jourKeys.forEach((jourKey) => {
			const day = dayConfig.find((item) => item.key === jourKey);
			if (day && day.attributionIndex != null) {
				// On écrit le matricule cible dans la colonne Attribution
				// Ce n'est PAS un X, c'est le matricule du collaborateur qui prend le repas
				sheet.getRange(sourceRow, day.attributionIndex + 1).setValue(matriculeCible);
				updatedDays.push(jourKey);
			}
		});

		if (!updatedDays.length) throw new Error('Aucune colonne Attribution disponible pour ce jour.');
		return { success: true, message: 'Attribution enregistree.', matricule: matriculeSource, attribution: matriculeCible, jours: updatedDays };
	} finally {
		lock.releaseLock();
	}
}

function markMealTaken(params) {
	const matricule = String(params.matricule || '').trim();
	const dayKey = normalizeDayKey_(params.day || params.dayKey || params.jour || '');

	if (!matricule) throw new Error('Matricule obligatoire.');
	if (!dayKey) throw new Error('Jour invalide.');

	const lock = LockService.getScriptLock();
	lock.waitLock(5000);
	try {
		const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
		if (!sheet) throw new Error('Feuille introuvable: ' + SHEET_NAME);

		const values = sheet.getDataRange().getValues();
		const sheetConfig = resolveSheetConfig_(values);
		const dayConfig = sheetConfig.dayConfig.find((day) => day.key === dayKey);
		if (!dayConfig) throw new Error('Jour inconnu.');
		
		let targetRow = -1;
		for (let i = 1; i < values.length; i++) {
			if (normalizeKey_(values[i][0]) === normalizeKey_(matricule)) {
				targetRow = i + 1;
				break;
			}
		}
		if (targetRow < 0) throw new Error('Matricule introuvable.');

		const checkingCell = sheet.getRange(targetRow, dayConfig.checkingIndex + 1);
		const currentValue = String(checkingCell.getDisplayValue() || '').trim().toUpperCase();
		const timeCell = sheet.getRange(targetRow, dayConfig.timeIndex + 1);
		const currentTime = String(timeCell.getDisplayValue() || '').trim();
		
		if (currentValue === 'X') {
			return { success: true, alreadyTaken: true, message: 'Ce repas est deja pris.', day: dayKey, matricule, heurePointage: currentTime };
		}

		const now = new Date();
		const formattedTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
		checkingCell.setValue('X');
		timeCell.setValue(formattedTime);
		timeCell.setNumberFormat('HH:mm:ss');

		return { success: true, alreadyTaken: false, message: 'Repas marque comme pris.', day: dayKey, matricule, heurePointage: formattedTime };
	} finally {
		lock.releaseLock();
	}
}

function addCollaboratorRow(params) {
	const matricule = String(params.matricule || '').trim();
	const nomPrenom = String(params.nomPrenom || params.nom || '').trim();
	const selectedDays = normalizeDayList_(params.jours || params.jour || params.day || params.dayKey || '');

	if (!matricule) throw new Error('Matricule obligatoire.');
	if (!nomPrenom) throw new Error('Nom et prénom obligatoires.');
	if (!selectedDays.length) throw new Error('Au moins un jour doit être sélectionné.');

	const lock = LockService.getScriptLock();
	lock.waitLock(5000);
	try {
		const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
		if (!sheet) throw new Error('Feuille introuvable: ' + SHEET_NAME);

		const values = sheet.getDataRange().getValues();
		for (let i = 1; i < values.length; i++) {
			if (normalizeKey_(values[i][0]) === normalizeKey_(matricule)) throw new Error('Ce matricule existe déjà.');
		}

		const sheetConfig = resolveSheetConfig_(values);
		const dayConfig = sheetConfig.dayConfig;
		const rowWidth = Math.max(TOTAL_COLUMNS, sheet.getLastColumn(), sheetConfig.avatarIndex + 1);
		const rowValues = Array(rowWidth).fill('');
		rowValues[0] = matricule;
		rowValues[1] = nomPrenom;
		// Marquer la colonne "Nouveau Collaborateur" (BA)
		rowValues[sheetConfig.newCollaboratorIndex] = 'X';
		
		selectedDays.forEach((dayKey) => {
			const day = dayConfig.find((item) => item.key === dayKey);
			if (day) {
				// Marquer la colonne Rajout du jour correspondant
				rowValues[day.rajoutIndex] = 'X';
			}
		});
		
		sheet.appendRow(rowValues);
		return { success: true, message: 'Nouveau collaborateur ajouté.', matricule, nomPrenom, isAddedCollaborator: true, jours: selectedDays };
	} finally {
		lock.releaseLock();
	}
}

function buildRajoutIndex_(values, dayConfig) {
	const index = {};
	const days = Array.isArray(dayConfig) && dayConfig.length ? dayConfig : DAY_CONFIG;
	if (!Array.isArray(values) || values.length <= 1) return index;

	values.slice(1).forEach((row) => {
		const matricule = normalizeKey_(row[0]);
		const existingDays = days.filter((day) => String(row[day.rajoutIndex] || '').trim().toUpperCase() === 'X').map((day) => day.key);
		if (!matricule || !existingDays.length) return;
		if (!index[matricule]) index[matricule] = {};
		existingDays.forEach((existingDay) => { index[matricule][existingDay] = { date: '', label: 'Rajouté' }; });
	});
	return index;
}

function normalizeKey_(value) { return String(value || '').trim().toLowerCase(); }

function normalizeDayKey_(value) {
	const mapping = { lundi: 'lundi', mardi: 'mardi', mercredi: 'mercredi', jeudi: 'jeudi', vendredi: 'vendredi', samedi: 'samedi', dimanche: 'dimanche', monday: 'lundi', tuesday: 'mardi', wednesday: 'mercredi', thursday: 'jeudi', friday: 'vendredi', saturday: 'samedi', sunday: 'dimanche' };
	return mapping[String(value || '').trim().toLowerCase()] || '';
}

function normalizeDayList_(value) {
	if (Array.isArray(value)) return value.map((item) => normalizeDayKey_(item)).filter(Boolean);
	return String(value || '').split(',').map((item) => normalizeDayKey_(item)).filter(Boolean);
}

function getSummaryCounts_(rows, dayConfig) {
	const days = Array.isArray(dayConfig) && dayConfig.length ? dayConfig : DAY_CONFIG;
	let noPlanningCount = 0, noChoiceCount = 0, simpleRajoutCount = 0, newCollaboratorCount = 0;

	rows.forEach((row) => {
		const hasPlanning = days.some((day) => String(row.days[day.key].planning || '').trim() !== '');
		const hasChoice = days.some((day) => String(row.days[day.key].choice || '').trim() !== '');
		if (!hasPlanning) noPlanningCount++;
		if (!hasChoice) noChoiceCount++;
		if (row.isSimpleRajout) simpleRajoutCount++;
		if (row.isAddedCollaborator) newCollaboratorCount++;
	});
	return { noPlanningCount, noChoiceCount, simpleRajoutCount, newCollaboratorCount };
}