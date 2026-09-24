"""
Script to generate a comprehensive, professionally styled PDF containing the
GigScore Presentation Deck Master Prompt, System Design, and 14-Slide Blueprint.
"""
import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print total page numbers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "GigScore — Presentation Deck Master Prompt & System Design Specification")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)

        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_str)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — GIGSCORE FINTECH PLATFORM")
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        self.restoreState()


def build_pdf(filename="GigScore_Presentation_Deck_Prompt_and_System_Design.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom color palette
    c_primary = colors.HexColor("#0B132B")
    c_secondary = colors.HexColor("#1E3A8A")
    c_accent = colors.HexColor("#0D9488")
    c_dark = colors.HexColor("#1E293B")
    c_muted = colors.HexColor("#475569")
    c_bg_box = colors.HexColor("#F8FAFC")
    c_border = colors.HexColor("#CBD5E1")

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=c_primary,
        alignment=0,
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=c_secondary,
        alignment=0,
        spaceAfter=15
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=c_secondary,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=c_primary,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    h3_style = ParagraphStyle(
        'Heading3_Custom',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=c_accent,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body_Custom',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_dark,
        spaceAfter=6
    )
    body_bold = ParagraphStyle(
        'Body_Bold_Custom',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=c_dark,
        spaceAfter=4
    )
    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_dark,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )
    code_box_style = ParagraphStyle(
        'CodeBox',
        fontName='Courier',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#0F172A")
    )
    speaker_note_style = ParagraphStyle(
        'SpeakerNote',
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155")
    )

    story = []

    # -------------------------------------------------------------
    # COVER / HEADER SECTION
    # -------------------------------------------------------------
    story.append(Paragraph("GigScore: Master Presentation Deck & Architecture Guide", title_style))
    story.append(Paragraph("Comprehensive AI Prompt, Slide-by-Slide Blueprint, System Design, and Technical Specifications", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=c_accent, spaceBefore=2, spaceAfter=14))

    meta_table_data = [
        [
            Paragraph("<b>Project:</b> GigScore Alternative Credit Platform", body_style),
            Paragraph("<b>Target Domain:</b> FinTech / Gig-Economy Lending", body_style)
        ],
        [
            Paragraph("<b>Architecture:</b> FastAPI + MongoDB + React 19 + OpenCV", body_style),
            Paragraph("<b>ML Core:</b> Calibrated XGBoost v3.2 + SHAP TreeExplainer", body_style)
        ],
        [
            Paragraph("<b>Concurrency:</b> 50+ Concurrent Active Users (Zero Drops)", body_style),
            Paragraph("<b>Document Purpose:</b> Prompt for PPT Generators & Deck Script", body_style)
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[250, 254])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # -------------------------------------------------------------
    # SECTION 1: MASTER COPY-PASTE PROMPT FOR PPT GENERATION
    # -------------------------------------------------------------
    story.append(Paragraph("1. Master Copy-Paste Prompt for AI Presentation Tools", h1_style))
    story.append(Paragraph(
        "Copy and paste the exact text below into AI presentation tools such as <b>Gamma App, ChatGPT (with SlidesGPT), Claude, Tome, or Beautiful.ai</b> to automatically generate the full presentation.",
        body_style
    ))

    prompt_text = (
        "Act as an elite FinTech Systems Architect, ML Engineer, and Technical Presenter. Generate a comprehensive, "
        "14-slide, professional presentation deck for our project: 'GigScore: Explainable Alternative Credit Scoring "
        "& Underwriting Platform for Gig-Economy Workers'.<br/><br/>"
        "Create modern, high-impact, content-rich slides with clear visual hierarchies, system architecture diagrams "
        "(ASCII/Mermaid), quantitative ML metrics, step-by-step operational workflows, and speaker notes for every slide.<br/><br/>"
        "<b>Ensure the presentation thoroughly covers:</b><br/>"
        "1. <b>The Problem:</b> The credit invisibility crisis of 15M+ gig drivers & delivery partners (lack of CIBIL/bureau scores, volatile weekly cash flows, predatory loan shark traps).<br/>"
        "2. <b>The Solution:</b> Alternative underwriting using earnings telemetry, ride data, behavioral consistency, biometric KYC, and explainable AI.<br/>"
        "3. <b>System Architecture & Concurrency:</b> FastAPI ASGI cluster, AnyIO threadpool scaling (150 worker tokens), MongoDB Atlas connection pool (min=15, max=150), Cloudinary CDN, and pre-warmed models.<br/>"
        "4. <b>Step-by-Step Workflow:</b> Onboarding -> Statement ingestion -> Parsing -> 18 Feature Engineering -> Calibrated ML scoring (300-900) -> SHAP waterfall -> Underwriter sanction cockpit -> Disbursement.<br/>"
        "5. <b>Machine Learning & Explainability:</b> Calibrated XGBoost v3.2 (ROC-AUC 0.957, PR-AUC 0.922, Accuracy 93.25%, Brier score 0.061), feature importance ranking, and SHAP TreeExplainer local attribution.<br/>"
        "6. <b>Biometric Face Security:</b> OpenCV DNN YuNet (5-point microsecond landmarks) + SFace (128-D deep embeddings) + geometric facial invariant analysis.<br/>"
        "7. <b>Tri-Portal UX:</b> Driver Portal, Lender / Underwriter Cockpit, and Admin Ops / MLOps Console.<br/>"
        "8. <b>Production Engineering:</b> Sub-second P95 latency (&lt;450ms), GZip compression, and anti-sleep keepalive background bot.<br/><br/>"
        "<b>Follow the detailed 14-slide outline below:</b><br/>"
        "• Slide 1: Title Slide (Cover, Metadata, Vision)<br/>"
        "• Slide 2: The Core Problem & Market Opportunity (Credit Invisibility Trap)<br/>"
        "• Slide 3: The GigScore Solution & Core Value Proposition<br/>"
        "• Slide 4: High-Level System Architecture & Concurrency Design<br/>"
        "• Slide 5: Step-by-Step Operational Lifecycle (End-to-End Workflow)<br/>"
        "• Slide 6: Feature Engineering Pipeline (The 18 Core Signals)<br/>"
        "• Slide 7: Machine Learning Benchmark & Model Competition<br/>"
        "• Slide 8: Explainable AI (XAI) & SHAP Transparency Engine<br/>"
        "• Slide 9: Biometric Face Authentication & Anti-Fraud Computer Vision<br/>"
        "• Slide 10: Multi-Role System Portals & User Experience (3 Cockpits)<br/>"
        "• Slide 11: Underwriting Rules & Automated Policy Decision Matrix<br/>"
        "• Slide 12: Production Engineering, Resilience & Latency Benchmarks<br/>"
        "• Slide 13: Horizontal & Vertical Scalability Roadmap<br/>"
        "• Slide 14: Conclusion, Business Impact & Strategic Vision"
    )

    prompt_table = Table([[Paragraph(prompt_text, code_box_style)]], colWidths=[504])
    prompt_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_bg_box),
        ('BOX', (0, 0), (-1, -1), 1, c_border),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(prompt_table)
    story.append(Spacer(1, 14))

    # -------------------------------------------------------------
    # SECTION 2: SYSTEM ARCHITECTURE SPECIFICATION
    # -------------------------------------------------------------
    story.append(Paragraph("2. System Design & Concurrency Architecture Specification", h1_style))
    story.append(Paragraph(
        "GigScore is engineered with a high-concurrency architecture capable of supporting <b>50+ simultaneous active users</b> "
        "with zero request drops, sub-second latency (P95 &lt; 450ms), and full transactional integrity.",
        body_style
    ))

    arch_diagram_text = (
        "+-------------------------------------------------------------------------+<br/>"
        "|                 CLIENT LAYER (React 19 + Vite Frontend)                 |<br/>"
        "|       Driver Portal    *    Underwriter Cockpit    *    MLOps Console   |<br/>"
        "+------------------------------------+------------------------------------+<br/>"
        "                                     | HTTPS / REST API / JWT HS256<br/>"
        "                                     v<br/>"
        "+-------------------------------------------------------------------------+<br/>"
        "|                    INGRESS & ASGI SERVER TIER (FastAPI)                 |<br/>"
        "|    * Uvicorn ASGI Process Cluster (Backlog: 2048, Concurrency Limit: 200)|<br/>"
        "|    * GZip Compression Middleware (Transfers reduced up to 75%)          |<br/>"
        "|    * AnyIO Scaled Threadpool: 150 Tokens (Prevents 40-token queue)      |<br/>"
        "+-------------------+--------------------+--------------------+-------+<br/>"
        "                    |                    |                    |        <br/>"
        "                    v                    v                    v        <br/>"
        "+------------------------+ +--------------------+ +-------------------+<br/>"
        "|   AI / ML SUBSYSTEM    | |   COMPUTER VISION  | |   DATABASE TIER   |<br/>"
        "| * Pre-warmed XGBoost   | | * Pre-warmed OpenCV| | * MongoDB Atlas   |<br/>"
        "|   v3.2 Calibrator      | |   YuNet (5-pts)    | |   minPoolSize: 15 |<br/>"
        "| * Pre-warmed SHAP Tree | | * Pre-warmed OpenCV| |   maxPoolSize: 150|<br/>"
        "|   Explainer in Memory  | |   SFace (128-D)    | | * Pre-warmed TCP  |<br/>"
        "+------------------------+ +--------------------+ +-------------------+<br/>"
        "                    |                                         |        <br/>"
        "                    +--------------------+--------------------+        <br/>"
        "                                         v                             <br/>"
        "                         +------------------------------+              <br/>"
        "                         |       MEDIA & CDN TIER       |              <br/>"
        "                         | Cloudinary Media Cloud (CDN) |              <br/>"
        "                         |   (Biometrics & Statements)  |              <br/>"
        "                         +------------------------------+"
    )
    arch_table = Table([[Paragraph(arch_diagram_text, code_box_style)]], colWidths=[504])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#38BDF8")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#1E293B")),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 10))

    # Concurrency table
    concurrency_data = [
        [Paragraph("<b>Component</b>", body_bold), Paragraph("<b>Default Setting</b>", body_bold), Paragraph("<b>GigScore High-Capacity Tuned</b>", body_bold), Paragraph("<b>Impact Solved</b>", body_bold)],
        [Paragraph("AnyIO Threadpool", body_style), Paragraph("40 worker tokens", body_style), Paragraph("<b>150 worker tokens</b>", body_style), Paragraph("Eliminates thread exhaustion under 50-user burst traffic.", body_style)],
        [Paragraph("MongoDB Sockets", body_style), Paragraph("minPoolSize = 0", body_style), Paragraph("<b>minPoolSize = 15, max = 150</b>", body_style), Paragraph("Zero TLS renegotiation latency spikes.", body_style)],
        [Paragraph("Model Lifecycle", body_style), Paragraph("Load on first request", body_style), Paragraph("<b>Pre-warmed in FastAPI lifespan</b>", body_style), Paragraph("Prevents cold-start disk I/O thundering herd.", body_style)],
        [Paragraph("Payload Transfer", body_style), Paragraph("Uncompressed JSON", body_style), Paragraph("<b>GZipMiddleware (min: 1KB)</b>", body_style), Paragraph("Reduces SHAP factor download sizes by 75%.", body_style)]
    ]
    conc_table = Table(concurrency_data, colWidths=[90, 95, 140, 179])
    conc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(conc_table)

    story.append(PageBreak())

    # -------------------------------------------------------------
    # SECTION 3: STEP-BY-STEP OPERATIONAL LIFECYCLE
    # -------------------------------------------------------------
    story.append(Paragraph("3. Step-by-Step Project Workflow (End-to-End)", h1_style))
    story.append(Paragraph(
        "Here is how a transaction travels from the driver's smartphone through the data processing pipeline to the lender's loan sanctioning desk:",
        body_style
    ))

    steps = [
        ("Step 1: Driver Onboarding & Biometric KYC Enrollment",
         "The driver signs up via the Driver Portal. The system initiates a browser webcam session where the driver's face is scanned. "
         "The OpenCV YuNet deep detector pinpoints 5 key landmarks, and SFace computes an affine-aligned 128-dimensional biometric vector. "
         "The portrait is stored securely on Cloudinary CDN, and the biometric embedding is persisted to the MongoDB user document."),
        
        ("Step 2: Platform Earnings Statement Ingestion",
         "The driver uploads their earnings statements (PDF/CSV/DOCX) from platforms like Uber, Ola, Swiggy, or Zomato. "
         "The file is validated, uploaded to Cloudinary CDN, and recorded in MongoDB with rollback protection."),

        ("Step 3: Multi-Format Document Parsing & Normalization",
         "The PdfParserService and DocumentParserService run regex and tabular extraction pipelines. "
         "It extracts monthly trips, active days, gross earnings, platform commission deductions, fuel costs, net income, cancellation rates, and customer ratings."),

        ("Step 4: 18-Dimensional Feature Engineering",
         "The FeatureService transforms raw monthly telemetry into 18 ML variables: lowest monthly income floor (min_income), "
         "income volatility (coefficient of variation), 3-month income trajectory slope, disposable income surplus, and requested EMI-to-income ratio."),

        ("Step 5: Calibrated XGBoost Inference & Credit Scoring",
         "The pre-warmed calibrated XGBoost model predicts the exact Probability of Default (Pd). "
         "The system transforms Pd into an institutional credit score: <b>Score = 900 - (Pd * 600)</b>, bounded between 300 and 900. "
         "The score is classified into Risk Tiers: Prime (>=750), Near-Prime (600-749), or Subprime (<600)."),

        ("Step 6: SHAP Explainability & Factor Attribution",
         "The SHAP TreeExplainer calculates local feature attributions around the base expected score. "
         "The system generates human-readable explanations (e.g., 'Low cancellation rate boosted score by +32 points') and actionable tips."),

        ("Step 7: Underwriter Sanction Cockpit & Policy Decisioning",
         "The loan application enters the Underwriter review queue with status PENDING. "
         "The underwriter examines the score, risk band, debt-serviceability ratio, and SHAP factors, and can Approve, Reject, or Counter-Offer with adjusted terms."),

        ("Step 8: Sanction Generation & Disbursement",
         "Upon sanction approval, an automated sanction agreement is logged in the MongoDB audit trail, the driver is notified on their dashboard, "
         "and the repayment schedule is initialized.")
    ]

    for title, desc in steps:
        step_box = [
            [Paragraph(f"<b>{title}</b>", body_bold)],
            [Paragraph(desc, body_style)]
        ]
        s_tbl = Table(step_box, colWidths=[504])
        s_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#E2E8F0")),
            ('LINELEFT', (0, 0), (0, -1), 3, c_secondary),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(s_tbl)
        story.append(Spacer(1, 6))

    story.append(PageBreak())

    # -------------------------------------------------------------
    # SECTION 4: SLIDE-BY-SLIDE BLUEPRINT (ALL 14 SLIDES)
    # -------------------------------------------------------------
    story.append(Paragraph("4. Complete 14-Slide Presentation Deck Blueprint", h1_style))
    story.append(Paragraph(
        "This section provides the exact content, visual design recommendations, and speaker scripts for every single slide in the deck.",
        body_style
    ))

    slides_content = [
        {
            "num": 1,
            "title": "Title Slide (Cover)",
            "subtitle": "Unlocking Fair, Data-Driven Lending for the Gig Economy",
            "visual": "Dark navy theme (#0B132B), emerald accent badge, dual driver silhouette and interactive credit score gauge.",
            "bullets": [
                "<b>Project:</b> GigScore Alternative Credit Risk Assessment Platform",
                "<b>Core Capabilities:</b> Telemetry Underwriting | Calibrated Machine Learning | SHAP XAI | Face Biometrics",
                "<b>Target Sector:</b> 15 Million+ underserved gig workers, taxi drivers, and delivery partners across emerging markets",
                "<b>Architectural Scale:</b> High-concurrency engine engineered for 50+ simultaneous active users with zero request drops"
            ],
            "notes": "Introduce the team and hook the audience: Gig workers power our modern cities, yet when they apply for formal loans, banks shut the door. GigScore changes this."
        },
        {
            "num": 2,
            "title": "The Core Problem & Market Opportunity",
            "subtitle": "The Credit Invisibility Trap for 15M+ Gig Workers",
            "visual": "Three-way comparison chart: Traditional Banking Requirements vs. Gig Worker Reality vs. Harmful Outcomes.",
            "bullets": [
                "<b>Bureau Blindspot:</b> Over 87% of gig workers have no CIBIL or bureau history; traditional algorithms auto-reject them due to lack of payslips and Form 16.",
                "<b>Income Volatility Misinterpretation:</b> Drivers earn steady annualized income (Rs. 25,000 to Rs. 50,000/mo), but weekly volatility triggers false credit risk flags.",
                "<b>Predatory Debt Traps:</b> Workers are forced into loan shark agreements charging 60% to 120% APR for routine vehicle maintenance or medical emergencies.",
                "<b>The Multi-Billion Market:</b> Massive untapped lending opportunity for FinTech NBFCs if underwriting can be grounded in actual ride telemetry."
            ],
            "notes": "Stress that gig workers are not credit-unworthy—they are simply credit-invisible under outdated banking frameworks."
        },
        {
            "num": 3,
            "title": "The GigScore Solution & Core Value Proposition",
            "subtitle": "Transforming Driving Telemetry into Verifiable Creditworthiness",
            "visual": "Central engine graphic taking in 4 platform streams and outputting an institutional 300–900 GigScore.",
            "bullets": [
                "<b>Holistic Alternative Underwriting:</b> Converts platform statements (trips, earnings, fuel, cancellation rates) into bankable credit profiles.",
                "<b>Institutional 300 to 900 Score:</b> Calibrated probability-of-default mapped directly to familiar credit tiers (Prime, Near-Prime, Subprime).",
                "<b>Explainable AI (XAI) by Design:</b> Zero black-box rejections; SHAP TreeExplainer delivers exact reasons and actionable improvement advice.",
                "<b>Deep Biometric KYC:</b> Microsecond OpenCV YuNet + SFace facial verification prevents identity theft and unauthorized account sharing.",
                "<b>Sub-Second Sanctioning:</b> P95 latency under 450ms delivers instantaneous pre-qualification and automated underwriter routing."
            ],
            "notes": "Walk through the four pillars: Telemetry data, Calibrated ML, Explainable AI, and Deep Biometric Security."
        },
        {
            "num": 4,
            "title": "System Design: High-Concurrency Cloud Architecture",
            "subtitle": "Engineered for 50+ Concurrent Users & Sub-Second Latency",
            "visual": "Tiered architecture diagram showing Client -> Ingress -> AnyIO Threadpool -> Pre-Warmed ML/Vision Engines -> MongoDB Atlas.",
            "bullets": [
                "<b>Client Tier:</b> React 19 + Vite responsive SPA with dedicated driver, underwriter, and MLOps dashboards.",
                "<b>Ingress Tier:</b> Uvicorn ASGI cluster with 2048 backlog and GZip payload compression reducing network traffic by up to 75%.",
                "<b>Concurrency Scaler:</b> Starlette AnyIO threadpool expanded from 40 to 150 worker tokens (600 total across workers), supporting 100 RPS bursts.",
                "<b>Pre-Warmed Engine Lifespans:</b> XGBoost, SHAP explainer, and OpenCV models pre-warmed into RAM—zero cold-start file I/O delays.",
                "<b>Database Connection Pool:</b> MongoDB Atlas configured with minPoolSize=15 pre-connected TCP sockets, eliminating TLS handshake spikes."
            ],
            "notes": "Emphasize to technical judges that this is not a prototype script—the concurrency and memory math were explicitly engineered for production workloads."
        },
        {
            "num": 5,
            "title": "Step-by-Step Operational Lifecycle",
            "subtitle": "The Complete Journey from Document Upload to Loan Sanction",
            "visual": "8-phase horizontal chevron pipeline showing real-time data transformations.",
            "bullets": [
                "<b>1. Driver Biometric Enrollment:</b> Webcam capture, YuNet landmark detection, and SFace 128-D vector saved to MongoDB & Cloudinary.",
                "<b>2. Statement Upload:</b> PDF/CSV earnings statements uploaded with automatic format validation and rollback protection.",
                "<b>3. Document Parsing:</b> Regex and tabular parsers extract monthly trips, gross earnings, platform cuts, fuel costs, and cancellation rates.",
                "<b>4. Feature Synthesis:</b> Generates 18 telemetry features including disposable income, coefficient of variation, and income trends.",
                "<b>5. Calibrated Scoring:</b> Calibrated XGBoost predicts default probability and computes the 300–900 GigScore.",
                "<b>6. SHAP Transparency:</b> Computes local feature contributions for driver-facing tips and underwriter risk audits.",
                "<b>7. Underwriter Review:</b> Underwriter inspects application in Lender Cockpit and selects Approve, Counter-Offer, or Deny.",
                "<b>8. Sanction & Disbursement:</b> Sanction letter generated and recorded in immutable MongoDB audit logs."
            ],
            "notes": "Explain that every step is synchronous, auditable, and completed in under 2 seconds total."
        },
        {
            "num": 6,
            "title": "Feature Engineering: The 18 Multidimensional Signals",
            "subtitle": "Extracting Predictive Behavioral Signals from Unstructured Telemetry",
            "visual": "4-quadrant diagram grouping features into Income Stability, Operational Discipline, Platform Tenure, and Affordability.",
            "bullets": [
                "<b>Income Volatility Group:</b> min_income (earnings safety floor), avg_monthly_net_income, income_std, coefficient_of_variation (CV = sigma / mu), months_with_income.",
                "<b>Operational Discipline Group:</b> cancellation_rate (key proxy for reliability), completion_rate, avg_rating (customer service index).",
                "<b>Platform Tenure & Intensity:</b> tenure_months, active_days_monthly, trips_per_day, trips_per_month.",
                "<b>Dynamic Earning Patterns:</b> peak_hour_share, weekend_share, income_slope_3m (3-month rolling growth rate), recent_vs_historical_income.",
                "<b>Affordability Guardrails:</b> estimated_disposable_income, requested_emi_to_income."
            ],
            "notes": "Point out how features like cancellation_rate and min_income capture operational conscientiousness and worst-case cash flow resilience."
        },
        {
            "num": 7,
            "title": "Machine Learning Benchmarks & Model Competition",
            "subtitle": "Champion XGBoost Model Outperforms Baselines with 93.25% Accuracy",
            "visual": "Model benchmark table with highlighted champion row and horizontal bar chart of top 5 feature importances.",
            "bullets": [
                "<b>Model Evaluation Suite:</b> Evaluated Logistic Regression (Baseline), Random Forest, and Calibrated XGBoost across 2,000 samples.",
                "<b>Champion Performance:</b> Calibrated XGBoost achieved <b>ROC-AUC: 0.957</b>, <b>PR-AUC: 0.922</b>, <b>Accuracy: 93.25%</b>, and <b>Brier Score: 0.061</b>.",
                "<b>The Calibration Advantage:</b> Platt sigmoid calibration aligns raw tree margins with true empirical default probabilities.",
                "<b>Top Feature Importances:</b>",
                "  • min_income: <b>48.0%</b> (Driver's baseline safety floor)",
                "  • cancellation_rate: <b>11.6%</b> (Operational reliability)",
                "  • coefficient_of_variation: <b>10.2%</b> (Income stability factor)",
                "  • completion_rate: <b>7.0%</b> (Trip fulfillment commitment)"
            ],
            "notes": "Highlight that min_income and cancellation_rate drive nearly 60% of the model's predictive power—demonstrating that behavioral discipline correlates with creditworthiness."
        },
        {
            "num": 8,
            "title": "Explainable AI (XAI) & SHAP Transparency Engine",
            "subtitle": "Transforming Opaque Risk Scores into Actionable Driver Coaching",
            "visual": "Mockup of SHAP waterfall attribution plot and driver-facing credit improvement card.",
            "bullets": [
                "<b>The Black-Box Dilemma:</b> Fair lending regulations and RBI mandates reject opaque credit decisions without actionable adverse action notices.",
                "<b>SHAP TreeExplainer Formulation:</b> Decomposes each individual score into additive contributions: GigScore(x) = E[f(x)] + Sum(phi_i).",
                "<b>Driver Empowerment:</b> Drivers see exact reasons: 'High customer rating (+28 pts)', 'Zero cancellations in August (+35 pts)', 'Income volatility (-42 pts)'.",
                "<b>Actionable Coaching:</b> Provides concrete advice: 'Reducing ride cancellations below 4% will increase your GigScore by +38 points, unlocking lower interest rates.'"
            ],
            "notes": "Explain how explainability builds trust. Instead of feeling cheated by an algorithm, drivers are coached on how to improve."
        },
        {
            "num": 9,
            "title": "Biometric Face Authentication & Anti-Fraud Vision",
            "subtitle": "Microsecond OpenCV DNN Face Recognition & Invariant Geometry",
            "visual": "Facial mesh diagram showing YuNet 5-point landmarks, SFace affine alignment, and 128-D vector cosine similarity matching.",
            "bullets": [
                "<b>OpenCV YuNet Detection:</b> Microsecond deep face detection and 5-point landmark localization (eyes, nose, oral commissures) at 320x320 resolution.",
                "<b>OpenCV SFace 128-D Vectors:</b> Landmark-guided affine alignment normalizes head tilt before computing deep 128-dimensional metric embeddings.",
                "<b>Geometric Invariant Analysis:</b> Multi-element geometry verifies inter-ocular distance, golden triangles, and nasal-oral symmetry ratios.",
                "<b>Anti-Fraud & Privacy:</b> Calibrated threshold (0.55) separates genuine users (>0.88) from impostors (<0.42). Video is never stored; only encrypted vectors saved in MongoDB."
            ],
            "notes": "Explain that biometric security prevents common gig-economy fraud like account renting and loan stacking under fake identities."
        },
        {
            "num": 10,
            "title": "Multi-Role User Experience: Three Purpose-Built Cockpits",
            "subtitle": "Streamlined Interfaces for Drivers, Underwriters, and Platform Admins",
            "visual": "Three mockups showing Driver Score Gauge, Underwriter Review Cockpit, and Admin System Monitoring Console.",
            "bullets": [
                "<b>1. Driver Portal:</b> Interactive 300–900 Credit Score Gauge, risk tier badges, earnings volatility charts, and 1-click loan requests.",
                "<b>2. Lender & Underwriter Cockpit:</b> Live pending application queue, underwriting sanction speedometer, 1-click approval/counter-offer, and SHAP factor deep dive.",
                "<b>3. Admin & MLOps Console:</b> Real-time AnyIO thread capacity, MongoDB connection pool health, model drift tracking, and immutable audit logs."
            ],
            "notes": "Mention that role-based access control (RBAC) ensures strict data isolation between drivers and institutional underwriters."
        },
        {
            "num": 11,
            "title": "Underwriting Policies & Risk Band Decision Matrix",
            "subtitle": "Automated Guardrails Balancing Rapid Sanctions with Capital Protection",
            "visual": "Three-tiered risk table with color-coded policy rules and affordability formulas.",
            "bullets": [
                "<b>Credit Score Formula:</b> GigScore = 900 - (Probability_of_Default * 600), clamped between 300 and 900.",
                "<b>Prime Tier (Score >= 750 / Low Risk):</b> Auto-eligible up to Rs. 3,00,000 (up to 6x disposable income). EMI affordability ratio capped at 35%.",
                "<b>Near-Prime Tier (Score 600-749 / Medium Risk):</b> Eligible up to Rs. 1,20,000 (up to 3.5x disposable income). Routed to Underwriter Manual Review.",
                "<b>Subprime Tier (Score < 600 / High Risk):</b> Loan capped at Rs. 35,000 (1x disposable income). Requires risk mitigation.",
                "<b>Affordability Guardrail:</b> Affordability Ratio = Requested EMI / Estimated Disposable Income. Prevents over-leveraging regardless of score."
            ],
            "notes": "Show how the policy engine protects lenders by capping loans strictly to disposable income surplus, not just top-line gross earnings."
        },
        {
            "num": 12,
            "title": "Production Engineering, Resilience & Latency Benchmarks",
            "subtitle": "Sub-Second P95 Latency and Fault-Tolerant Cloud Infrastructure",
            "visual": "Metrics grid displaying P95 latency (<450ms), 0% drop rate, 75% compression ratio, and 50+ concurrent capacity.",
            "bullets": [
                "<b>Sub-Second P95 Latency:</b> Complete credit evaluation and SHAP factor extraction executed in under 450ms.",
                "<b>High-Concurrency Scalability:</b> AnyIO threadpool scaled to 150 worker tokens per process easily absorbs 100 RPS traffic spikes.",
                "<b>Bandwidth Optimization:</b> GZip compression reduces large JSON explainability trees and audit records by up to 75%.",
                "<b>Keepalive Background Daemon:</b> Integrated self-ping service and UptimeRobot hooks pinging every 5 minutes prevent cloud hosting sleep cycles.",
                "<b>Transactional Rollback Protection:</b> Document uploads clean up orphaned Cloudinary assets if MongoDB persistence fails."
            ],
            "notes": "Highlight that system reliability is baked in at every tier—from the network layer to the database connection pool."
        },
        {
            "num": 13,
            "title": "Scalability Roadmap & Enterprise Expansion",
            "subtitle": "From 50 Concurrent Users to National Platform Deployment",
            "visual": "3-phase evolution roadmap: Phase 1 (Single Node) -> Phase 2 (Distributed Cluster) -> Phase 3 (Kubernetes & Open Banking).",
            "bullets": [
                "<b>Phase 1 (Current Target):</b> 50 Concurrent Active Users | 1 Node, 4 Uvicorn workers, 150 AnyIO threads, Mongo Atlas M0/M2.",
                "<b>Phase 2 (Growth Target):</b> 250 Concurrent Users | 2 Nodes behind AWS Application Load Balancer, Redis session cache, Mongo Atlas M10.",
                "<b>Phase 3 (National Scale):</b> 1,000+ Concurrent Users | Kubernetes Horizontal Pod Autoscaler (HPA), Celery/RabbitMQ distributed OCR workers.",
                "<b>Open Banking Integration:</b> Direct API integration with India's Account Aggregator (AA) framework (Sahamati/Setu) for instant, consent-based bank statement pulls."
            ],
            "notes": "Show the vision forward: GigScore is modular and ready to plug directly into the national Account Aggregator ecosystem."
        },
        {
            "num": 14,
            "title": "Conclusion: Fair Credit for the Gig Economy",
            "subtitle": "Financial Inclusion Powered by Intelligent Engineering",
            "visual": "Inspiring closing layout with summary metrics, partnership vision, and Q&A prompt.",
            "bullets": [
                "<b>Empowering the Hardworking:</b> Converts daily hustle on the road into verifiable, institutional-grade creditworthiness.",
                "<b>De-Risking Digital Lenders:</b> 93.25% ML accuracy, calibrated risk bands, and biometric verification minimize non-performing loans.",
                "<b>Built for Production:</b> Complete, working codebase with FastAPI backend, MongoDB Atlas, React 19 frontend, and OpenCV vision.",
                "<b>Strategic Vision:</b> 'GigScore: Where Gig Work Meets Fair, Transparent Credit.'",
                "<b>Q&A Session:</b> Thank you! We are now ready for questions and a live platform demonstration."
            ],
            "notes": "Deliver a strong, memorable closing and invite the evaluators or audience to ask questions or watch the live demo."
        }
    ]

    for s in slides_content:
        # Group slide in a clean card table
        s_table_data = [
            [Paragraph(f"<b>SLIDE {s['num']}: {s['title']}</b>", h2_style)],
            [Paragraph(f"<b>Subtitle:</b> {s['subtitle']}", h3_style)],
            [Paragraph(f"<b>Visual / Layout:</b> {s['visual']}", body_style)],
            [HRFlowable(width="100%", thickness=0.5, color=c_border, spaceBefore=2, spaceAfter=4)],
            [Paragraph("<b>Key Slide Content:</b>", body_bold)]
        ]
        for b in s['bullets']:
            s_table_data.append([Paragraph(f"• {b}", bullet_style)])
        s_table_data.append([HRFlowable(width="100%", thickness=0.5, color=c_border, spaceBefore=4, spaceAfter=4)])
        s_table_data.append([Paragraph(f"<b>Presenter Talking Point:</b> \"{s['notes']}\"", speaker_note_style)])

        s_table = Table(s_table_data, colWidths=[504])
        s_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), c_bg_box),
            ('BOX', (0, 0), (-1, -1), 1, c_border),
            ('LINELEFT', (0, 0), (0, -1), 3, c_primary),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, 0), 4),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 4),
        ]))
        
        story.append(s_table)
        story.append(Spacer(1, 8))

    # Build the document with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[*] PDF successfully generated at: {os.path.abspath(filename)}")

if __name__ == "__main__":
    out_file = "GigScore_Presentation_Deck_Prompt_and_System_Design.pdf"
    if len(sys.argv) > 1:
        out_file = sys.argv[1]
    build_pdf(out_file)
