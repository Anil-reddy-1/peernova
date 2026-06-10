const fs = require('fs');

function replace(f, regex, replacement) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(f, content);
}

replace('./src/api/v1/payments/payments.service.ts', /return \{ type:/, 'return { status:');
replace('./src/api/v1/reviews/reviews.controller.ts', /const \{ chatId \} = req\.params;/, 'const { tutorId } = req.params;');
replace('./src/api/v1/reviews/reviews.service.ts', /return reviewRef\.id;/, 'return reviewRef.id as string;');
replace('./src/api/v1/sessions/sessions.controller.ts', /getSessionById\(id\)/, 'getSessionById(req.params.id as string)');
replace('./src/api/v1/sessions/sessions.controller.ts', /const session = await sessionsService\.getSessionById\(id as string\);/, 'const { id } = req.params; const session = await sessionsService.getSessionById(id as string);');
replace('./src/api/v1/sessions/sessions.controller.ts', /cancelSession\(id, /, 'cancelSession(req.params.id as string, ');
replace('./src/api/v1/sessions/sessions.controller.ts', /const session = await sessionsService\.cancelSession\(id as string, /, 'const { id } = req.params; const session = await sessionsService.cancelSession(id as string, ');
replace('./src/api/v1/sessions/sessions.controller.ts', /slotId: string/, 'slotId?: string'); // If it's a type

replace('./src/api/v1/tutors/tutors.controller.ts', /getTutorReviews\(id, page/, 'getTutorReviews(req.params.id as string, page');
replace('./src/api/v1/tutors/tutors.controller.ts', /reportTutor\(id\)/, 'reportTutor(req.params.id as string)');
replace('./src/api/v1/tutors/tutors.controller.ts', /verifyTutor\(id\)/, 'verifyTutor(req.params.id as string)');
replace('./src/api/v1/tutors/tutors.controller.ts', /getTutorAvailability\(id\)/, 'getTutorAvailability(req.params.id as string)');
replace('./src/api/v1/tutors/tutors.controller.ts', /const \{ id \} = req\.params;/, ''); // remove extra
replace('./src/api/v1/tutors/tutors.controller.ts', /const slot = await tutorsService\.createAvailabilitySlot\(slotId as string, /, 'const { tutorId } = req.params; const slot = await tutorsService.createAvailabilitySlot(tutorId as string, ');

replace('./src/api/v1/tutors/tutors.service.ts', /deletedAt: null,/g, '');

console.log("Done");
