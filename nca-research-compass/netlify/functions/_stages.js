// The guided research journey. Stage 1 (problem statement) is captured at
// project creation and is not AI-generated; stages 2-9 are generated on demand.

const STAGES = [
  { number: 1, key: "problem_statement", title: "Problem Statement" },
  { number: 2, key: "research_question_objectives", title: "Research Question & Objectives" },
  { number: 3, key: "literature_review_framework", title: "Literature Review Framework" },
  { number: 4, key: "hypothesis", title: "Hypothesis" },
  { number: 5, key: "research_design_methodology", title: "Research Design & Methodology" },
  { number: 6, key: "sampling_data_collection", title: "Sampling & Data Collection Tools" },
  { number: 7, key: "data_analysis_plan", title: "Data Analysis Plan" },
  { number: 8, key: "ethical_considerations", title: "Ethical Considerations" },
  { number: 9, key: "report_writeup", title: "Research Proposal Write-up" },
];

const BASE_CONTEXT = `You are a nursing research mentor helping a final-year BSc Nursing student in India, writing for the Indian Nursing Council (INC) curriculum and Indian clinical/community settings.

Formatting rules (follow strictly):
- Never use LaTeX or math notation. Do not write dollar signs, backslashes, or symbols like $H_1$ or \\(H_0\\). Write hypothesis labels in plain text, e.g. "H1 (Research Hypothesis):" and "H0 (Null Hypothesis):".
- Use plain markdown only: ### for headings, **bold** for emphasis, - for bullet points, numbered lists where relevant. No tables, no code blocks, no math syntax.

Indian context rules (follow strictly):
- Ground every example in Indian settings: government or private hospitals, Primary Health Centres (PHCs), Community Health Centres, Anganwadi centres, or urban/rural Indian communities as appropriate to the topic.
- Refer to the ethics body as the "Institutional Ethics Committee (IEC)", matching Indian practice, not generic "IRB".
- Where costs are mentioned, use Indian Rupees (₹), not dollars.
- Use terminology and sampling/statistical conventions as taught in Indian nursing research textbooks (e.g., convenience sampling, purposive sampling, Cochran's or Yamane's formula for sample size, Chi-square/t-test as commonly used).
- Avoid generic Western examples (e.g., US insurance systems, Western dietary references) unless the problem statement specifically calls for them.`;

const PROMPTS = {
  research_question_objectives: (ps) => `${BASE_CONTEXT}

The student's problem statement is:

"${ps}"

Write:
1. A clear, single research question.
2. 3-5 specific, measurable research objectives (numbered).
3. Operational definitions of key terms used in the problem statement.

Do not add a preamble.`,

  literature_review_framework: (ps) => `${BASE_CONTEXT}

The student's problem statement is:

"${ps}"

Create a literature review framework with:
1. 4-6 relevant sub-themes the student should search for, each with a one-line description of what to look for.
2. Suggested search terms/keywords for databases like PubMed and Google Scholar, including Indian-context search terms where relevant.
3. A short paragraph explaining how to organize the review (e.g., by theme, chronologically) and how it should conclude by pointing to the research gap.

Do not add a preamble.`,

  hypothesis: (ps) => `${BASE_CONTEXT}

The student's problem statement is:

"${ps}"

Write:
1. Whether a hypothesis is appropriate for this type of study, briefly explaining why or why not.
2. If appropriate, a research hypothesis (H1) and null hypothesis (H0), clearly labeled in plain text (no math notation).
3. If a hypothesis is not appropriate (e.g., purely descriptive study), explain what to state instead.

Do not add a preamble.`,

  research_design_methodology: (ps) => `${BASE_CONTEXT}

The student's problem statement is:

"${ps}"

Recommend and justify:
1. Research approach (quantitative/qualitative/mixed) and specific research design (e.g., descriptive survey, quasi-experimental).
2. Study setting (a realistic Indian hospital, PHC, or community setting appropriate to the topic).
3. Study population and target group.
4. Variables (independent/dependent, if applicable).

Do not add a preamble.`,

  sampling_data_collection: (ps) => `${BASE_CONTEXT}

The student's problem statement is:

"${ps}"

Provide:
1. Recommended sampling technique and a justification.
2. A reasonable sample size with simple justification (a formula-based estimate is welcome, kept simple, using conventions taught in Indian nursing research).
3. Inclusion and exclusion criteria (bulleted).
4. A recommended data collection tool (e.g., structured questionnaire, checklist, rating scale) with a short outline of its sections.
5. Data collection procedure in brief steps.

Do not add a preamble.`,

  data_analysis_plan: (ps) => `${BASE_CONTEXT}

The student's problem statement is:

"${ps}"

Provide a data analysis plan with:
1. Descriptive statistics to be used (with rationale).
2. Inferential statistics to be used, if applicable (with rationale, matched to likely data type).
3. How findings will be organized (e.g., sections/tables to plan for).

Do not add a preamble.`,

  ethical_considerations: (ps) => `${BASE_CONTEXT}

The student's problem statement is:

"${ps}"

List and briefly explain the ethical considerations relevant to this study, including:
1. Institutional Ethics Committee (IEC) approval.
2. Informed consent process.
3. Confidentiality and data protection.
4. Voluntary participation and right to withdraw.
5. Any risk-specific considerations for this particular topic/population.

Do not add a preamble.`,

  report_writeup: (ps) => `${BASE_CONTEXT}

The student's problem statement is:

"${ps}"

Produce a research proposal outline/write-up skeleton covering the standard chapters used in Indian BSc Nursing research proposals:
1. Introduction & Background
2. Need for the Study
3. Problem Statement (restate it)
4. Objectives
5. Hypothesis (if applicable)
6. Operational Definitions
7. Research Methodology (approach, design, setting, population, sample, tool, procedure)
8. Ethical Considerations
9. Plan for Data Analysis

For each chapter, write 2-4 sentences of guidance on what belongs there, tailored to this specific problem statement, not generic advice. Format with clear numbered headings. Do not add a preamble.`,
};

module.exports = { STAGES, PROMPTS };
