// ... existing code ...

# Security Hardening Specification for HowAI Connects Adapters

This document specifies security measures for adapters in the HowAI Connects platform, focusing on validation, sanitization, and injection protection. It builds on the architecture outlined in [docs/airtable-integration-design.md](docs/airtable-integration-design.md) and the tech stack in [docs/tech-stack_documentation_sitemaps.csv](docs/tech-stack_documentation_sitemaps.csv). All adapters (Latitude, Airtable, Miro, CrewAI, Zapier) must implement these measures to prevent vulnerabilities like SQL injection, XSS, and API abuse.

## 1. Input Validation
All adapter inputs (API params, query strings, bodies) must be validated before processing.

- **Schema Validation**: Use Zod or Joi for type-safe validation. Define schemas per adapter method.
  - Example for LatitudeAdapter.createPrompt:
    ```typescript
    const createPromptSchema = z.object({
      title: z.string().min(1).max(100),
      content: z.string().min(10),
      variables: z.record(z.string()),
    });
    ```
  - Reference: Align with Supabase auth validation in tech-stack docs.

- **Range Checks**: Enforce limits (e.g., prompt length < 4000 chars for AI models).
- **Format Validation**: Sanitize URLs, emails, IDs (UUIDs) using regex or libraries like validator.js.

- **Implementation**: Wrap adapter.execute() with validation; throw AdapterError on failure.

## 2. Sanitization
Clean inputs to prevent injection attacks and data corruption.

- **HTML/XSS Sanitization**: Use DOMPurify for user-generated content (e.g., prompt descriptions).
  - Install: `pnpm add dompurify`
  - Example:
    ```typescript
    import DOMPurify from 'dompurify';
    const sanitizedContent = DOMPurify.sanitize(input.content);
    ```

- **SQL/NoSQL Injection Prevention**: Use parameterized queries for Airtable/Prisma.
  - Reference: Airtable API flows in [docs/airtable-integration-design.md](docs/airtable-integration-design.md) use JSON payloads with field mapping.

- **Command Injection**: For shell-like operations (if any), use child_process.spawn with validation.
- **Output Sanitization**: Strip sensitive data (API keys, tokens) from logs/responses.

- **Libraries**: Integrate with existing stack (Next.js API routes) for middleware sanitization.

## 3. Injection Protection
Specific protections against common injection vectors.

- **Prompt Injection**: For AI adapters (Latitude, CrewAI), implement guardrails:
  - Prefix/suffix system prompts with "Ignore previous instructions."
  - Use prompt templates with placeholders only for user input.
  - Validate against known injection patterns (e.g., regex for "forget everything").

- **API Injection**: Rate-limit endpoints (upscale from Next.js rate-limit in tech-stack).
  - Example: 100 req/min per user for adapter calls.
  - Use Supabase RLS for data access control.

- **OAuth/Token Protection**: Store tokens in env vars or Supabase secrets; refresh automatically.
  - Reference: Auth propagation in adapter interface spec [docs/adapter-interface-spec.md](docs/adapter-interface-spec.md).

- **Error Handling**: Never expose stack traces; use generic error messages in production.

## 4. Cross-Adapter Security
- **Shared BaseAdapter**: Extend BaseAdapter with validation/sanitization hooks (e.g., preExecuteValidation()).
- **JWT Enforcement**: Propagate Supabase JWT; verify roles before operations.
- **Monitoring**: Log security events to Airtable tasks table for audit.

## 5. Testing & Compliance
- **Unit Tests**: Mock malicious inputs; assert validation failures.
- **Security Scans**: Integrate OWASP ZAP or npm audit in CI (reference GitHub workflows).
- **Compliance**: Align with GDPR for PII; encrypt sensitive fields in Airtable.

This spec ensures secure, robust adapters. Update as new threats emerge.