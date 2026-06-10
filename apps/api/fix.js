const fs = require('fs');

function fix(f) {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');

  // Fix the missing id from req.params
  content = content.replace(/const \{  \} = req\.params as Record<string, string>;\s+const \{ status, resolutionNotes \}/, 'const { id } = req.params as Record<string, string>;\n      const { status, resolutionNotes }');
  content = content.replace(/const \{  \} = req\.params as Record<string, string>;\s+const page =/, 'const { chatId } = req.params as Record<string, string>;\n      const page =');
  content = content.replace(/const \{  \} = req\.params as Record<string, string>;\s+const tutor =/, 'const { id } = req.params as Record<string, string>;\n      const tutor =');
  content = content.replace(/const \{  \} = req\.params as Record<string, string>;\s+const reviews =/, 'const { tutorId } = req.params as Record<string, string>;\n      const reviews =');
  content = content.replace(/const \{  \} = req\.params as Record<string, string>;\s+const sessions = await sessionsService\.getSessionsByTutor/, 'const { tutorId } = req.params as Record<string, string>;\n      const sessions = await sessionsService.getSessionsByTutor');
  content = content.replace(/const \{  \} = req\.params as Record<string, string>;\s+const sessions = await sessionsService\.getSessionsByStudent/, 'const { studentId } = req.params as Record<string, string>;\n      const sessions = await sessionsService.getSessionsByStudent');
  content = content.replace(/const \{  \} = req\.params as Record<string, string>;\s+const session =/, 'const { id } = req.params as Record<string, string>;\n      const session =');
  content = content.replace(/const \{  \} = req\.params as Record<string, string>;\s+const \{ reason \}/, 'const { id } = req.params as Record<string, string>;\n      const { reason }');
  
  // Actually, wait, let's just do it dynamically:
  // admin.controller
  if (f.includes('admin.controller.ts')) {
    content = content.replace(/const \{  \} = req\.params.*/, 'const { id } = req.params;');
  }
  if (f.includes('chat.controller.ts')) {
    content = content.replace(/const \{  \} = req\.params.*/, 'const { chatId } = req.params;');
  }
  if (f.includes('reviews.controller.ts')) {
    content = content.replace(/const \{  \} = req\.params.*/, 'const { tutorId } = req.params;');
  }
  if (f.includes('sessions.controller.ts')) {
    content = content.replace(/const \{  \} = req\.params.*/g, function(match, offset, string) {
       if (string.substring(offset).includes('getSessionsByTutor')) return 'const { tutorId } = req.params;';
       if (string.substring(offset).includes('getSessionsByStudent')) return 'const { studentId } = req.params;';
       return 'const { id } = req.params;';
    });
  }
  if (f.includes('tutors.controller.ts')) {
    content = content.replace(/const \{  \} = req\.params.*/g, function(match, offset, string) {
       return 'const { id } = req.params;';
    });
  }

  // Also fix missing imports and unused vars
  content = content.replace(/_req: Request/g, 'req: Request');
  content = content.replace(/_userId: string/g, 'userId: string');
  content = content.replace(/_next: NextFunction/g, 'next: NextFunction');

  fs.writeFileSync(f, content);
}

fix('./src/api/v1/admin/admin.controller.ts');
fix('./src/api/v1/chat/chat.controller.ts');
fix('./src/api/v1/payments/payments.controller.ts');
fix('./src/api/v1/reviews/reviews.controller.ts');
fix('./src/api/v1/sessions/sessions.controller.ts');
fix('./src/api/v1/tutors/tutors.controller.ts');

console.log('Done fixing params');
