// Local-only integration checks. Creates clearly named test users and one test project.
const fs = require('fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const base = process.env.DEVSIM_API || 'http://127.0.0.1:8080/api/v1';
const checks = [];
async function request(path, token, body, method = body ? 'POST' : 'GET', expected = 200) {
  const r = await fetch(base + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) }, body: body ? body instanceof FormData ? body : JSON.stringify(body) : undefined });
  const raw = await r.text(); const json = raw ? JSON.parse(raw) : {};
  if (r.status !== expected) throw new Error(`${method} ${path}: expected ${expected}, got ${r.status}: ${json.message}`);
  return json.data;
}
const check = name => { checks.push(name); console.log('PASS ' + name); };
async function main() {
  const suffix = Date.now().toString(36); const password = crypto.randomBytes(15).toString('base64url');
  const auto = await request('/auth/register', null, { name: 'Onboarding Smoke Student', email: `smoke.auto.${suffix}@example.test`, password }, 'POST', 201);
  const guided = await request('/auth/register', null, { name: 'Guided Smoke Student', email: `smoke.guided.${suffix}@example.test`, password }, 'POST', 201);
  const admin = await request('/auth/login', null, { email: process.env.DEVSIM_ADMIN_EMAIL || 'superadmin@devsim.com', password: process.env.DEVSIM_ADMIN_PASSWORD || 'password123' });
  assert.equal(auto.profile.onboardingCompleted, false); check('Registration returns an incomplete persistent profile');
  const projects = await request('/projects'); const tracks = await request('/career-tracks');
  const java = tracks.find(t => t.slug === 'java-backend-developer'); const react = tracks.find(t => t.slug === 'frontend-developer');
  assert(java && react); assert(projects.some(p => !p.company)); check('Multi-track catalog includes standalone projects');
  await request('/enrollments', auto.token, { projectId: projects[0].id }, 'POST', 400); check('Direct enrollment cannot bypass mandatory onboarding');
  const form = new FormData(); form.append('file', new Blob(['Java Spring Boot PostgreSQL Git JUnit'], { type: 'text/plain' }), 'resume.txt');
  const parsed = await request('/journey/resume', auto.token, form); assert(parsed.skills.includes('Java')); assert.equal(parsed.parser, 'LOCAL_TEXT_EXTRACTION'); check('Resume upload extracts local skills');
  const bad = new FormData(); bad.append('file', new Blob(['bad']), 'resume.exe'); await request('/journey/resume', auto.token, bad, 'POST', 400); check('Unsupported upload rejected');
  const setup = { skills: parsed.skills, goal: 'Build Java APIs and improve validation and tests', weeklyHours: 8, careerTrackId: java.id, experienceLevel: 'BEGINNER', assignmentMode: 'AUTOMATED' };
  await request('/journey', auto.token, setup, 'PUT');
  const assessed = await request('/journey/assessment', auto.token, { answers: [1, 0, 2], solution: 'if (records == null) return []; return records.filter(record => record.active);' }); assert.equal(assessed.score, 100); check('Starter assessment persists its provisional score');
  const state = await request('/journey', auto.token); assert(state.recommendations.length > 1); assert.equal(state.recommendations[0].project.careerTrack.id, java.id);
  const id = state.recommendations.find(r => !r.project.company)?.project.id || state.recommendations[0].project.id;
  await request('/journey/complete', auto.token, { projectId: id });
  const enrollment = await request('/enrollments/current', auto.token); let board = await request(`/enrollments/${enrollment.id}/workspace`, auto.token);
  assert.equal(board.tickets.length, 3); assert(board.tickets.every(t => t.targetUserId === auto.userId)); check('Automatic assignment creates 3 private personalized tickets');
  const source = board.tickets[0].generationSource;
  await request('/journey/complete', auto.token, { projectId: id }); board = await request(`/enrollments/${enrollment.id}/workspace`, auto.token); assert.equal(board.tickets.length, 3); check('Repeated completion is idempotent');
  assert.equal((await request('/auth/me', auto.token)).profile.onboardingCompleted, true); check('Completion survives session refresh');
  await request('/enrollments', auto.token, { projectId: projects.find(p => p.id !== id).id }, 'POST', 400); check('Catalog enrollment cannot silently replace the personalized assignment');
  await request(`/enrollments/${enrollment.id}/workspace`, guided.token, null, 'GET', 403);
  await request(`/enrollments/${enrollment.id}/tickets/${board.tickets[0].id}/status`, guided.token, { status: 'IN_PROGRESS' }, 'PATCH', 403); check('Cross-student workspace and status changes denied');
  const publicTickets = await request(`/projects/${id}/tickets`); assert(publicTickets.every(t => !t.targetUserId)); check('Public tickets never expose student-private assignments');
  const hint = await request(`/enrollments/${enrollment.id}/tickets/${board.tickets[0].id}/hint`, auto.token, undefined, 'POST'); assert.equal(hint.hintsUsed, 1); check('Progressive hint usage persists');
  await request('/journey/next-sprint', auto.token, undefined, 'POST', 400); check('Incomplete sprint cannot unlock another sprint');
  const first = await request(`/enrollments/${enrollment.id}/tickets/${board.tickets[0].id}/status`, auto.token, { status: 'IN_REVIEW', submissionNotes: 'return 1;' }, 'PATCH'); assert.notEqual(first.status, 'DONE'); check('Trivial submissions request changes');
  if (source === 'BUILT_IN') {
    const code = `import java.util.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class ResourceService {
  private final Map<Integer,String> resources = new HashMap<>();
  public List<String> listResources() { if (resources.isEmpty()) return List.of(); return new ArrayList<>(resources.values()); }
  public String createRecord(int id, String requiredField) { if (requiredField == null || requiredField.isBlank()) throw new IllegalArgumentException("Invalid input"); resources.put(id, requiredField); return requiredField; }
  public String getResource(int id) { if (!resources.containsKey(id)) throw new NoSuchElementException("Not found: unknown ID"); return resources.get(id); }
  @Test void normalAndEmptyResults() { ResourceService service = new ResourceService(); assertTrue(service.listResources().isEmpty()); service.createRecord(1, "Record"); assertEquals(List.of("Record"), service.listResources()); }
  @Test void validAndInvalidInput() { ResourceService service = new ResourceService(); assertThrows(IllegalArgumentException.class, () -> service.createRecord(1, " ")); assertEquals("Valid", service.createRecord(1, "Valid")); }
  @Test void successfulRetrievalOfExistingAndMissingIds() { ResourceService service = new ResourceService(); service.createRecord(1, "Present"); assertEquals("Present", service.getResource(1)); assertThrows(NoSuchElementException.class, () -> service.getResource(9)); }
}`;
    for (const ticket of board.tickets) {
      const reviewed = await request(`/enrollments/${enrollment.id}/tickets/${ticket.id}/status`, auto.token, { status: 'IN_REVIEW', submissionNotes: code }, 'PATCH');
      assert.equal(reviewed.status, 'DONE', reviewed.aiReviewFeedback); assert.equal(reviewed.reviewScore, 100);
    }
    check('Complete code and test submissions receive explicitly provisional simulation reviews');
    await request(`/enrollments/${enrollment.id}/tickets/${board.tickets[0].id}/status`, auto.token, { status: 'DONE', submissionNotes: 'changed after review' }, 'PATCH', 400); check('Reviewed completed submissions cannot be overwritten');
    const next = await request('/journey/next-sprint', auto.token, undefined, 'POST'); assert.equal(next.difficulty, 'INTERMEDIATE');
    const updated = await request(`/enrollments/${enrollment.id}/workspace`, auto.token); assert.equal(updated.tickets.length, 6); assert.equal(updated.completedTickets, 3);
    check('Completed sprint unlocks a higher level based on scores, attempts and hints');
    const proof = await request('/journey/evidence', auto.token); assert.equal(proof.completedTickets.length, 3); check('Evidence contains actual persisted completed tickets');
  }
  await request('/journey', guided.token, { ...setup, skills: ['React', 'TypeScript'], careerTrackId: react.id, assignmentMode: 'GUIDED', requestNote: 'Please help me choose a frontend project.' }, 'PUT');
  await request('/journey/assessment', guided.token, { answers: [1, 0, 2], solution: 'if (records == null) return []; return records.filter(record => record.active);' });
  let gs = await request('/journey', guided.token); const preferred = gs.recommendations[0].project.id;
  await request('/journey/complete', guided.token, { projectId: preferred }); assert.equal(await request('/enrollments/current', guided.token), null);
  await request('/enrollments', guided.token, { projectId: preferred }, 'POST', 400); check('Guided mode creates a request and waits for approval');
  await request('/super-admin/assignment-requests', auto.token, undefined, 'GET', 403); check('Student cannot access admin request queue');
  let queue = await request('/super-admin/assignment-requests', admin.token); assert(queue.some(r => r.userId === guided.userId));
  await request(`/super-admin/assignment-requests/${guided.userId}/review`, admin.token, { approve: false, projectId: preferred, note: 'Please clarify your frontend goals.' }); assert.equal((await request('/auth/me', guided.token)).profile.onboardingCompleted, false); check('Admin change request reopens mandatory onboarding');
  await request('/journey', guided.token, { ...setup, skills: ['React', 'TypeScript'], careerTrackId: react.id, assignmentMode: 'GUIDED', requestNote: 'I want accessible React UI and testing experience.' }, 'PUT');
  await request('/journey/complete', guided.token, { projectId: preferred });
  await request(`/super-admin/assignment-requests/${guided.userId}/review`, admin.token, { approve: true, projectId: preferred, note: 'Approved for React starter sprint.' });
  const ge = await request('/enrollments/current', guided.token); assert.equal(ge.project.id, preferred); const gb = await request(`/enrollments/${ge.id}/workspace`, guided.token); assert.equal(gb.tickets.length, 3); check('Admin approval assigns the project and private tickets');
  await request(`/super-admin/assignment-requests/${guided.userId}/review`, admin.token, { approve: true, projectId: preferred, note: '' }, 'POST', 400); check('Duplicate admin approval does not create another sprint');
  const created = await request('/admin/projects', admin.token, { careerTrackId: java.id, name: `Smoke API ${suffix}`, slug: `smoke-api-${suffix}`, shortDescription: 'Local integration test project', description: 'Build a validated resource API with tests and setup instructions.', difficulty: 'BEGINNER', estimatedDuration: '2 weeks', technologies: ['Java', 'JUnit'] }, 'POST', 201);
  assert.equal(created.company, null); assert(created.technologies.includes('JUnit')); check('Super admin creates projects without companies and persists technologies');
  await request(`/super-admin/users/${guided.userId}/assign-project`, admin.token, { projectId: created.id, autoGenerateAiTasks: true, difficultyLevel: 'BEGINNER', focusArea: 'Core resources' });
  assert.equal((await request('/journey', guided.token)).journey.preferredProjectId, created.id); assert.equal((await request('/enrollments/current', guided.token)).project.id, created.id); check('Admin transfer keeps the journey and current workspace synchronized');
  const evidence = await request('/journey/evidence', auto.token); assert(Array.isArray(evidence.completedTickets)); assert(evidence.verification.includes('No code execution')); check('Evidence output includes accurate verification limits');
  fs.mkdirSync('.local', { recursive: true });
  fs.writeFileSync('.local/journey-smoke-report.json', JSON.stringify({ passed: checks.length, checks, source, testUsers: [auto.email, guided.email], testProject: created.slug }, null, 2));
  fs.writeFileSync('.local/demo-account.json', JSON.stringify({ email: auto.email, password }, null, 2));
  console.log(`Completed ${checks.length} integration checks. Ticket source: ${source}.`);
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
