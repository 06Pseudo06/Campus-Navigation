"""
CampusWay IEEE-Style Software Requirements Specification (SRS) Report Builder.
Generates a complete, publication-grade academic document:
'CampusWay_IEEE_SRS_Report.docx'

Conforms to IEEE Std 830-1998 / IEEE Std 29148-2018 guidelines and university Continuous Assessment 3 (CA3) requirements.
"""

import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

DIAGRAMS_DIR = os.path.join(os.path.dirname(__file__), "diagrams")
OUTPUT_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "CampusWay_IEEE_SRS_Report.docx"))
OUTPUT_PATH_REFINED = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "CampusWay_IEEE_SRS_Report_Refined.docx"))

# Color constants
HEX_NAVY = "1B365D"       # Primary IEEE Header Navy
HEX_ACCENT = "E8452C"     # Vermilion Accent
HEX_LIGHT_GRAY = "F8F9FA" # Row zebra striping
HEX_BORDER = "CCCCCC"     # Clean table border
HEX_TEXT_DARK = "1A1A1A"  # Off-black body text
HEX_CALLOUT_BG = "F0F4F8" # Callout background

COLOR_NAVY = RGBColor(0x1B, 0x36, 0x5D)
COLOR_ACCENT = RGBColor(0xE8, 0x45, 0x2C)
COLOR_DARK = RGBColor(0x1A, 0x1A, 0x1A)
COLOR_MUTED = RGBColor(0x55, 0x55, 0x55)

def set_cell_background(cell, hex_color):
    """Apply background shading to a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    """Apply internal padding (in dxa: 20 dxa = 1 pt) to a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3", sz="4", val="single"):
    """Apply clean academic table borders (horizontal rules only)."""
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="8" w:space="0" w:color="{HEX_NAVY}"/>'
        f'<w:bottom w:val="{val}" w:sz="8" w:space="0" w:color="{HEX_NAVY}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def style_table_header(row, col_widths=None):
    """Format table header row with deep navy fill, white bold text, and center/left alignment."""
    for idx, cell in enumerate(row.cells):
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        if col_widths and idx < len(col_widths):
            cell.width = col_widths[idx]
        for p in cell.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = "Times New Roman"
                run.font.size = Pt(10)
                run.font.bold = True
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

def style_table_rows(table, col_widths=None):
    """Format table body rows with alternating shading, clean padding, and consistent font."""
    for r_idx, row in enumerate(table.rows[1:]):
        bg = HEX_LIGHT_GRAY if (r_idx % 2 == 1) else "FFFFFF"
        for c_idx, cell in enumerate(row.cells):
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            if col_widths and c_idx < len(col_widths):
                cell.width = col_widths[c_idx]
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.name = "Times New Roman"
                    run.font.size = Pt(9.5)
                    run.font.color.rgb = COLOR_DARK

def add_callout_box(doc, text, title="TECHNICAL SPECIFICATION NOTE"):
    """Add a professional academic alert callout box."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, HEX_CALLOUT_BG)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    # Left vertical accent border
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="none"/>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{HEX_ACCENT}"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    r_title = p.add_run(f"[{title}]\n")
    r_title.bold = True
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(9.5)
    r_title.font.color.rgb = COLOR_ACCENT
    
    r_body = p.add_run(text)
    r_body.font.name = "Times New Roman"
    r_body.font.size = Pt(9.5)
    r_body.font.color.rgb = COLOR_DARK
    
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_heading_1(doc, text):
    """Add major Section Heading (e.g. 1. INTRODUCTION)."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(14)
    run.font.bold = True
    run.font.color.rgb = COLOR_NAVY
    return p

def add_heading_2(doc, text):
    """Add Subsection Heading (e.g. 1.1 Purpose)."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(12)
    run.font.bold = True
    run.font.color.rgb = COLOR_NAVY
    return p

def add_heading_3(doc, text):
    """Add Sub-subsection Heading (e.g. 3.1.1 User Interfaces)."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.color.rgb = COLOR_ACCENT
    return p

def add_heading_4(doc, text):
    """Add Level 4 Subheading (e.g. Inputs & Data Parameters)."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.left_indent = Inches(0.15)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(10.5)
    run.font.bold = True
    run.font.color.rgb = COLOR_NAVY
    return p

def add_bullet_item(doc, bold_prefix, text):
    """Add indented bullet item with optional bold prefix."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.left_indent = Inches(0.35)
    p.paragraph_format.line_spacing = 1.15
    
    r_sym = p.add_run("•  ")
    r_sym.font.name = "Times New Roman"
    r_sym.font.size = Pt(10)
    r_sym.font.color.rgb = COLOR_ACCENT
    r_sym.bold = True
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Times New Roman"
        r_pre.font.size = Pt(10.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_DARK
        
    r_body = p.add_run(text)
    r_body.font.name = "Times New Roman"
    r_body.font.size = Pt(10.5)
    r_body.font.color.rgb = COLOR_DARK
    return p

def add_numbered_item(doc, step_num, bold_prefix, text):
    """Add indented numbered workflow step."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.left_indent = Inches(0.35)
    p.paragraph_format.line_spacing = 1.15
    
    r_num = p.add_run(f"Step {step_num}.  ")
    r_num.font.name = "Times New Roman"
    r_num.font.size = Pt(10)
    r_num.font.color.rgb = COLOR_NAVY
    r_num.bold = True
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Times New Roman"
        r_pre.font.size = Pt(10.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_DARK
        
    r_body = p.add_run(text)
    r_body.font.name = "Times New Roman"
    r_body.font.size = Pt(10.5)
    r_body.font.color.rgb = COLOR_DARK
    return p

def add_body_p(doc, text, bold_prefix="", italic=False):
    """Add standard justified body paragraph with 1.15 line spacing."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Times New Roman"
        r_pre.font.size = Pt(11)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_DARK
        
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(11)
    run.font.italic = italic
    run.font.color.rgb = COLOR_DARK
    return p

def add_figure_image(doc, img_name, fig_num, caption):
    """Embed diagram image with centered alignment and formal IEEE figure caption."""
    img_path = os.path.join(DIAGRAMS_DIR, img_name)
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(img_path, width=Inches(6.2))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_before = Pt(2)
        p_cap.paragraph_format.space_after = Pt(12)
        p_cap.paragraph_format.keep_with_next = True
        
        r_num = p_cap.add_run(f"Figure {fig_num}: ")
        r_num.bold = True
        r_num.font.name = "Times New Roman"
        r_num.font.size = Pt(10)
        r_num.font.color.rgb = COLOR_NAVY
        
        r_text = p_cap.add_run(caption)
        r_text.font.name = "Times New Roman"
        r_text.font.size = Pt(10)
        r_text.font.italic = True
        r_text.font.color.rgb = COLOR_DARK
    else:
        add_body_p(doc, f"[Figure {fig_num}: {caption} — Image asset missing at {img_name}]", bold_prefix="[Figure Error]: ")

def add_requirement_card(doc, req_id, title, priority, intro, inputs, processing, outputs, errors, pre, post, acceptance, verification="Demonstration & Automated Test"):
    """Render a formal IEEE Requirement / Use Case in structured narrative format."""
    p_hdr = doc.add_paragraph()
    p_hdr.paragraph_format.space_before = Pt(10)
    p_hdr.paragraph_format.space_after = Pt(2)
    p_hdr.paragraph_format.keep_with_next = True
    
    r_id = p_hdr.add_run(f"{req_id}: {title}")
    r_id.bold = True
    r_id.font.name = "Times New Roman"
    r_id.font.size = Pt(11.5)
    r_id.font.color.rgb = COLOR_NAVY
    
    r_sp = p_hdr.add_run("   |   Priority: ")
    r_sp.font.name = "Times New Roman"
    r_sp.font.size = Pt(10)
    r_sp.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
    
    r_pri = p_hdr.add_run(priority)
    r_pri.bold = True
    r_pri.font.name = "Times New Roman"
    r_pri.font.size = Pt(10)
    r_pri.font.color.rgb = COLOR_ACCENT if ("Critical" in priority or "High" in priority) else COLOR_NAVY
    
    # Narrative description
    add_body_p(doc, intro)
    
    # Subheading: Inputs
    add_heading_4(doc, "Inputs & Data Parameters:")
    for inp in inputs.split("\n"):
        if inp.strip():
            add_bullet_item(doc, "", inp.strip())
            
    # Subheading: Processing
    add_heading_4(doc, "Processing Logic & Sequential Execution:")
    proc_lines = processing.split("\n")
    for idx, proc in enumerate(proc_lines, start=1):
        proc_clean = proc.strip()
        if proc_clean:
            if len(proc_clean) > 2 and proc_clean[0].isdigit() and proc_clean[1] in (".", ")"):
                proc_clean = proc_clean[2:].strip()
            add_numbered_item(doc, str(idx), "", proc_clean)
            
    # Subheading: Outputs
    add_heading_4(doc, "Expected Outputs & System State:")
    for out in outputs.split("\n"):
        if out.strip():
            add_bullet_item(doc, "", out.strip())
            
    # Subheading: Exceptions
    add_heading_4(doc, "Exception Handling & Error Flows:")
    for err in errors.split("\n"):
        if err.strip():
            add_bullet_item(doc, "", err.strip())
            
    # Subheading: Conditions
    add_heading_4(doc, "Preconditions & Postconditions:")
    add_bullet_item(doc, "Preconditions: ", pre)
    add_bullet_item(doc, "Postconditions: ", post)
    
    # Subheading: Acceptance & Verification
    add_heading_4(doc, "Acceptance Criteria & Verification:")
    add_bullet_item(doc, "Acceptance Criteria: ", acceptance)
    add_bullet_item(doc, "Verification Method: ", verification)
    
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(6)

print("Builder helper functions configured.")

def build_title_page(doc):
    """Construct professional IEEE / University CA3 Title Page."""
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(36)
    p_inst.paragraph_format.space_after = Pt(2)
    r_inst = p_inst.add_run("LOVELY PROFESSIONAL UNIVERSITY\n")
    r_inst.bold = True
    r_inst.font.name = "Times New Roman"
    r_inst.font.size = Pt(16)
    r_inst.font.color.rgb = COLOR_NAVY
    
    r_sch = p_inst.add_run("School of Computer Science and Engineering\nDepartment of Computer Science and Engineering")
    r_sch.font.name = "Times New Roman"
    r_sch.font.size = Pt(12)
    r_sch.font.color.rgb = COLOR_MUTED
    
    # Decorative line
    p_sep = doc.add_paragraph()
    p_sep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sep.paragraph_format.space_before = Pt(18)
    p_sep.paragraph_format.space_after = Pt(24)
    r_sep = p_sep.add_run("—" * 38)
    r_sep.font.color.rgb = COLOR_ACCENT
    r_sep.bold = True
    
    # Document Title
    p_doc = doc.add_paragraph()
    p_doc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_doc.paragraph_format.space_before = Pt(12)
    p_doc.paragraph_format.space_after = Pt(8)
    r_doc = p_doc.add_run("SOFTWARE REQUIREMENTS SPECIFICATION (SRS)\n")
    r_doc.bold = True
    r_doc.font.name = "Times New Roman"
    r_doc.font.size = Pt(20)
    r_doc.font.color.rgb = COLOR_NAVY
    
    # Subtitle / Project
    p_proj = doc.add_paragraph()
    p_proj.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_proj.paragraph_format.space_before = Pt(6)
    p_proj.paragraph_format.space_after = Pt(18)
    r_proj = p_proj.add_run("CAMPUSWAY: AN ACCESSIBLE, SPATIAL GRAPH-DRIVEN WAYFINDING AND ADMINISTRATIVE CONTROL PLATFORM FOR LOVELY PROFESSIONAL UNIVERSITY\n")
    r_proj.bold = True
    r_proj.font.name = "Times New Roman"
    r_proj.font.size = Pt(13)
    r_proj.font.color.rgb = COLOR_ACCENT
    
    r_std = p_proj.add_run("Conforming to IEEE Std 830-1998 & IEEE Std 29148-2018 Specifications")
    r_std.font.name = "Times New Roman"
    r_std.font.size = Pt(10.5)
    r_std.font.italic = True
    r_std.font.color.rgb = COLOR_MUTED
    
    p_meta_sep = doc.add_paragraph()
    p_meta_sep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta_sep.paragraph_format.space_before = Pt(24)
    p_meta_sep.paragraph_format.space_after = Pt(24)
    r_msep = p_meta_sep.add_run("—" * 38)
    r_msep.font.color.rgb = COLOR_ACCENT
    
    # Submission Metadata Box Table
    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    set_table_borders(meta_table, color="CCCCCC")
    col_w = [Inches(2.4), Inches(4.1)]
    
    metadata_rows = [
        ("Course Title & Code:", "Software Engineering & Capstone Project (CSE422 / INT306)"),
        ("Assessment Component:", "Continuous Assessment 3 (CA3) — Comprehensive SRS Submission"),
        ("Academic Session:", "Autumn Term 2026 (Final Year Degree Program)"),
        ("Student Author(s):", "Kalyani Mahajan (Reg No: 12108745 | Section: K21FG)\n[Co-Author Team Members / Contributors Placeholder]"),
        ("Submitted To:", "Faculty Course Coordinator & Capstone Project Evaluation Committee"),
        ("Submission Date & Status:", "November 24, 2026 | Verified Final Technical Release v1.0")
    ]
    
    for idx, (lbl, val) in enumerate(metadata_rows):
        row = meta_table.rows[idx]
        bg = HEX_LIGHT_GRAY if idx % 2 == 1 else "FFFFFF"
        for c_idx, cell in enumerate(row.cells):
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            cell.width = col_w[c_idx]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            
        p_l = row.cells[0].paragraphs[0]
        r_l = p_l.add_run(lbl)
        r_l.bold = True
        r_l.font.name = "Times New Roman"
        r_l.font.size = Pt(10)
        r_l.font.color.rgb = COLOR_NAVY
        
        p_v = row.cells[1].paragraphs[0]
        r_v = p_v.add_run(val)
        r_v.font.name = "Times New Roman"
        r_v.font.size = Pt(10)
        r_v.font.color.rgb = COLOR_DARK
        
    doc.add_page_break()

def build_preliminary_pages(doc):
    """Construct Document Revision History, Abstract, TOC Outline, Lists of Figures/Tables, and Abbreviations."""
    add_heading_1(doc, "DOCUMENT CONTROL & REVISION HISTORY")
    add_body_p(doc, "This document establishes the authoritative Software Requirements Specification (SRS) for the CampusWay campus navigation and spatial intelligence platform. Changes to this specification are tracked, version-controlled, and audited in compliance with IEEE software documentation governance standards.")
    
    hist_table = doc.add_table(rows=4, cols=4)
    hist_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hist_table.autofit = False
    col_w = [Inches(1.0), Inches(1.3), Inches(2.7), Inches(1.5)]
    set_table_borders(hist_table)
    
    style_table_header(hist_table.rows[0], col_w)
    hdr_cells = hist_table.rows[0].cells
    hdr_cells[0].paragraphs[0].text = "Version"
    hdr_cells[1].paragraphs[0].text = "Release Date"
    hdr_cells[2].paragraphs[0].text = "Primary Revision Description"
    hdr_cells[3].paragraphs[0].text = "Author / Reviewer"
    style_table_header(hist_table.rows[0], col_w)
    
    rev_data = [
        ("v0.1", "Oct 18, 2026", "Initial requirements elicitation, problem formulation, and architectural scope definition for LPU campus wayfinding.", "CampusWay Team"),
        ("v0.5", "Nov 12, 2026", "Consolidation of surveyed spatial Dataset C (27 nodes, 29 edges), dual-mode auth design, and Mapbox GL WebGL integration.", "K. Mahajan / Lead Arch."),
        ("v1.0", "Nov 24, 2026", "Final production-grade SRS release incorporating Administrative Workspace (/admin), last-admin safety invariants, audit logging, and QR scanner.", "K. Mahajan / QA Lead")
    ]
    
    for idx, (v, d, desc, auth) in enumerate(rev_data, start=1):
        row = hist_table.rows[idx]
        row.cells[0].paragraphs[0].text = v
        row.cells[1].paragraphs[0].text = d
        row.cells[2].paragraphs[0].text = desc
        row.cells[3].paragraphs[0].text = auth
    style_table_rows(hist_table, col_w)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # Executive Summary / Abstract
    add_heading_2(doc, "Executive Summary")
    add_body_p(doc, "CampusWay is an accessible, web-native pedestrian navigation and spatial management platform designed specifically for Lovely Professional University (LPU), Phagwara, Punjab. Spanning more than 600 acres with an active population exceeding 35,000 students, faculty, and daily visitors, LPU presents significant spatial wayfinding challenges. Commercial mapping applications (such as Google Maps or Apple Maps) emphasize vehicular arterial roads, lack accurate pedestrian walkway graphs, fail to locate indoor academic block entrances, offer no step-free mobility assistance for wheelchair users, and lack synchronized physical QR signposts.")
    add_body_p(doc, "CampusWay resolves these deficiencies through an integrated multi-tier engineering architecture combining: (1) a verified, surveyed pedestrian topological graph (Dataset C: 27 nodes, 29 walkway segments, and 15 primary campus destinations including Block 34, Central Library, UniMall, and Main Gates); (2) high-performance graph algorithms executing Dijkstra and A* pathfinding solvers with O((V+E) log V) time complexity; (3) dynamic browser-native GPS positioning with <75m corridor snapping and >25m off-route recomputation; (4) physical-to-digital optical QR code wayfinding with instant deep-link routing; and (5) a secure, role-based Administrative Control Centre (/admin) providing POI verification, graph diagnostics, and immutable security audit trails. This document provides the complete, unambiguous, and testable functional and non-functional requirements governing the CampusWay platform.")

    doc.add_page_break()

    # Table of Contents Outline
    add_heading_1(doc, "TABLE OF CONTENTS")
    add_body_p(doc, "The following structured outline details the contents of this Software Requirements Specification. In Microsoft Word, right-click the outline and select 'Update Field' to refresh page numbers dynamically based on local pagination.")
    
    toc_items = [
        ("PRELIMINARY PAGES", "i"),
        ("  Document Control & Revision History", "ii"),
        ("  Executive Summary", "ii"),
        ("  List of Figures & List of Tables", "iv"),
        ("  List of Abbreviations", "v"),
        ("1. INTRODUCTION", "1"),
        ("  1.1 Purpose", "1"),
        ("  1.2 Scope", "2"),
        ("  1.3 Definitions, Acronyms, and Abbreviations", "4"),
        ("  1.4 References", "6"),
        ("  1.5 Overview of Document Organization", "7"),
        ("2. GENERAL DESCRIPTION", "8"),
        ("  2.1 Product Perspective", "8"),
        ("  2.2 Product Functions", "10"),
        ("  2.3 User Characteristics", "13"),
        ("  2.4 General Constraints", "14"),
        ("  2.5 Assumptions and Dependencies", "16"),
        ("3. SPECIFIC REQUIREMENTS", "18"),
        ("  3.1 External Interface Requirements", "18"),
        ("    3.1.1 User Interfaces", "18"),
        ("    3.1.2 Hardware Interfaces", "20"),
        ("    3.1.3 Software Interfaces", "21"),
        ("    3.1.4 Communications Interfaces", "23"),
        ("  3.2 Functional Requirements (FR-001 through FR-015)", "24"),
        ("  3.5 Non-Functional Requirements (NFR-001 through NFR-006)", "38"),
        ("    3.5.1 Performance Requirements", "38"),
        ("    3.5.2 Reliability & Fault Tolerance", "40"),
        ("    3.5.3 Availability & Uptime", "41"),
        ("    3.5.4 Security & Cryptographic Integrity", "42"),
        ("    3.5.5 Maintainability & Software Engineering Hygiene", "44"),
        ("    3.5.6 Portability & Cross-Platform Compliance", "45"),
        ("  3.7 Design Constraints", "46"),
        ("  3.9 Other Specialized Requirements", "48"),
        ("4. ANALYSIS MODELS", "50"),
        ("  4.1 Data Flow Diagrams (DFD Level 0, Level 1, Level 2)", "50"),
        ("  4.2 Additional Analysis Models (Use Case, Architecture, ERD, Activity, Sequence, State)", "55"),
        ("5. GITHUB LINK & SOURCE CODE ARCHITECTURE", "65")
    ]
    
    for title, pg in toc_items:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(1)
        p_t.paragraph_format.space_after = Pt(2)
        r_name = p_t.add_run(title)
        r_name.font.name = "Times New Roman"
        r_name.font.size = Pt(10)
        if not title.startswith("  "):
            r_name.bold = True
            r_name.font.color.rgb = COLOR_NAVY
        else:
            r_name.font.color.rgb = COLOR_DARK

    doc.add_page_break()

    # List of Figures & Tables
    add_heading_1(doc, "LIST OF FIGURES AND LIST OF TABLES")
    add_heading_2(doc, "List of Figures")
    
    figures_list = [
        ("Figure 1", "Context-Level Data Flow Diagram (DFD Level 0) — External Boundary Interactions", "Page 51"),
        ("Figure 2", "Data Flow Diagram Level 1 — Subsystem Functional Decomposition (Processes 1.0 to 6.0)", "Page 52"),
        ("Figure 3", "Data Flow Diagram Level 2 — Pathfinding & Navigation Subsystem (Process 3.0)", "Page 54"),
        ("Figure 4", "UML Use Case Diagram — System Actor Interactions and Functional Boundaries", "Page 56"),
        ("Figure 5", "Multi-Tier System Architecture Diagram — Presentation, Gateway, Engine, and Persistence", "Page 58"),
        ("Figure 6", "Relational Database Entity-Relationship Diagram (ERD) — Relational Foreign Key Topology", "Page 60"),
        ("Figure 7", "UML Activity Diagram — Shortest Path Generation and Real-Time Dynamic Rerouting", "Page 61"),
        ("Figure 8", "UML Sequence Diagram — Dual-Mode Authentication with Argon2id and Session Tokens", "Page 62"),
        ("Figure 9", "UML Sequence Diagram — Shortest-Path Route Calculation and Bearing HUD Pipeline", "Page 63"),
        ("Figure 10", "UML State Machine Diagram — Real-Time GPS Snapping and Spatial Boundary Lifecycle", "Page 64")
    ]
    for f_num, f_title, f_pg in figures_list:
        p_f = doc.add_paragraph()
        p_f.paragraph_format.space_before = Pt(1)
        p_f.paragraph_format.space_after = Pt(2)
        r_fn = p_f.add_run(f"{f_num}: ")
        r_fn.bold = True
        r_fn.font.name = "Times New Roman"
        r_fn.font.color.rgb = COLOR_NAVY
        r_ft = p_f.add_run(f"{f_title} ")
        r_ft.font.name = "Times New Roman"
        r_ft.font.italic = True
        
    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    add_heading_2(doc, "List of Tables")
    
    tables_list = [
        ("Table 1", "Document Control and Revision History Ledger", "Page ii"),
        ("Table 2", "Technical Definitions, Acronyms, and Abbreviations Catalog", "Page 4"),
        ("Table 3", "Verified Academic and Technical Framework References", "Page 6"),
        ("Table 4", "CampusWay Functional Implementation Status Matrix", "Page 11"),
        ("Table 5", "Campus User Classification, Operational Objectives, and Technical Profiles", "Page 13"),
        ("Table 6", "External Software Dependencies and Framework Specifications", "Page 21"),
        ("Table 7", "Non-Functional Requirements Quantitative Metric Thresholds (NFR-001 to NFR-006)", "Page 38"),
        ("Table 8", "Canonical Survey Dataset C Spatial Waypoint Nodes Catalog", "Page 48"),
        ("Table 9", "Canonical Survey Dataset C Walkable Pathway Segments (Edges) Catalog", "Page 49")
    ]
    for t_num, t_title, t_pg in tables_list:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.space_before = Pt(1)
        p_t.paragraph_format.space_after = Pt(2)
        r_tn = p_t.add_run(f"{t_num}: ")
        r_tn.bold = True
        r_tn.font.name = "Times New Roman"
        r_tn.font.color.rgb = COLOR_NAVY
        r_tt = p_t.add_run(f"{t_title} ")
        r_tt.font.name = "Times New Roman"
        r_tt.font.italic = True

    doc.add_page_break()

    # List of Abbreviations Table
    add_heading_1(doc, "LIST OF ABBREVIATIONS")
    add_body_p(doc, "The following catalog defines the standard engineering abbreviations, technical acronyms, and domain-specific terminology utilized throughout this Software Requirements Specification.")
    
    abbr_table = doc.add_table(rows=1, cols=3)
    abbr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    abbr_table.autofit = False
    col_w_abbr = [Inches(1.2), Inches(2.2), Inches(3.1)]
    set_table_borders(abbr_table)
    
    hdr = abbr_table.rows[0]
    hdr.cells[0].paragraphs[0].text = "Abbreviation"
    hdr.cells[1].paragraphs[0].text = "Full Term"
    hdr.cells[2].paragraphs[0].text = "Technical Definition / Context"
    style_table_header(hdr, col_w_abbr)
    
    abbr_data = [
        ("SRS", "Software Requirements Specification", "Formal document defining complete functional/non-functional behavior."),
        ("IEEE", "Institute of Electrical and Electronics Engineers", "Standardization organization defining software engineering documentation."),
        ("GIS", "Geographic Information System", "Framework for capturing, managing, analyzing, and displaying spatial data."),
        ("GPS", "Global Positioning System", "Satellite-based radionavigation system providing geospatial location."),
        ("WGS84", "World Geodetic System 1984", "Standard ellipsoidal reference coordinate datum utilized by GPS and Mapbox."),
        ("POI", "Point of Interest", "Discrete spatial campus landmark, building entrance, gate, or facility."),
        ("HUD", "Heads-Up Display", "Visual UI overlay presenting real-time turn guidance and distance instructions."),
        ("API", "Application Programming Interface", "Set of subroutine definitions, protocols, and tools for building software."),
        ("REST", "Representational State Transfer", "Stateless, client-server architectural style utilizing standard HTTP methods."),
        ("JWT", "JSON Web Token", "Compact, URL-safe means of representing claims transmitted between parties."),
        ("RBAC", "Role-Based Access Control", "Security mechanism restricting system operations based on assigned roles."),
        ("ORM", "Object-Relational Mapping", "Programming technique converting data between relational databases and OOP."),
        ("LRU", "Least Recently Used", "Cache eviction algorithm discarding least recently queried route results."),
        ("TTL", "Time to Live", "Data lifespan mechanism automatically invalidating stale routing cache."),
        ("DFD", "Data Flow Diagram", "Graphical representation of data flow through an information system."),
        ("ERD", "Entity-Relationship Diagram", "Structural diagram illustrating inter-entity database relationships."),
        ("UML", "Unified Modeling Language", "Standardized general-purpose modeling language in software engineering."),
        ("CORS", "Cross-Origin Resource Sharing", "W3C security mechanism governing cross-domain browser HTTP requests."),
        ("QR", "Quick Response Code", "Matrix 2D barcode optically readable by smartphone cameras for deep linking."),
        ("WCAG", "Web Content Accessibility Guidelines", "Global technical standards for digital accessibility compliance.")
    ]
    
    for row_tuple in abbr_data:
        r = abbr_table.add_row()
        for idx, val in enumerate(row_tuple):
            r.cells[idx].paragraphs[0].text = val
    style_table_rows(abbr_table, col_w_abbr)

    doc.add_page_break()

print("Title and preliminary builders configured.")

def build_section_1(doc):
    """Construct Section 1: INTRODUCTION."""
    add_heading_1(doc, "1. INTRODUCTION")
    
    # 1.1 Purpose
    add_heading_2(doc, "1.1 Purpose")
    add_body_p(doc, "This Software Requirements Specification (SRS) establishes the complete, authoritative, and unambiguous baseline of functional, non-functional, interface, and behavioral requirements for CampusWay — an accessible, spatial graph-driven campus navigation and administrative operations platform engineered for Lovely Professional University (LPU), Phagwara, Punjab.")
    add_body_p(doc, "The primary objective of this document is to provide a formal contract between academic evaluators, student developers, university administrative stakeholders, and maintenance engineers. By defining system capabilities, operational constraints, data models, algorithmic complexities, and verification criteria, this specification guides implementation, quality assurance testing, and independent verification throughout the software development lifecycle.")
    add_body_p(doc, "The intended audience includes:", bold_prefix="Target Readership & Stakeholders: ")
    add_body_p(doc, "1. University Faculty Evaluators & Capstone Mentors: Who will evaluate the architectural rigor, algorithmic soundness, accessibility standards, and academic engineering compliance of the project.")
    add_body_p(doc, "2. Full-Stack Software Engineers: Who require unambiguous API signatures, database schemas, cryptographic flows, and state machine definitions to implement and maintain the system.")
    add_body_p(doc, "3. Quality Assurance & Penetration Testers: Who rely on the functional acceptance criteria, edge-case bounds, and security invariants defined herein to design automated test suites.")
    add_body_p(doc, "4. Campus Administrative & Security Personnel: Who operate the administrative control centre to manage campus POIs, update walkway graphs, verify safety diagnostics, and inspect audit logs.")

    # 1.2 Scope
    add_heading_2(doc, "1.2 Scope")
    add_body_p(doc, "Lovely Professional University encompasses a contiguous campus territory exceeding 600 acres (approx. 2.4 square kilometers), housing dozens of massive multi-story academic blocks, student residential hostels, research centers, administrative pavilions, food kiosks, and athletic complexes. Over 35,000 students, faculty, staff members, and outside visitors traverse this expansive infrastructure daily.")
    add_body_p(doc, "Despite the sophistication of the physical campus, spatial wayfinding remains a substantial challenge. Commercial mapping platforms (e.g. Google Maps, Apple Maps) offer coarse road-level vehicular routing optimized for cars on peripheral access roads. They fail catastrophically inside pedestrian corridors because they: (a) do not contain surveyed pedestrian footpaths or covered walkways; (b) lack verified entrance coordinates for specific academic blocks; (c) provide zero step-free accessibility guidance for wheelchair-bound or mobility-impaired individuals; and (d) possess no synchronization with physical campus signposts.", bold_prefix="The Campus Wayfinding Problem: ")
    add_body_p(doc, "CampusWay resolves these spatial wayfinding barriers through an integrated web-native platform built upon three core operational services:", bold_prefix="System Core Modules: ")
    
    add_body_p(doc, "• Module 1 — Campus Map Service: An interactive vector WebGIS interface rendered via Mapbox GL JS with dynamic vector SVG fallback. Displays surveyed campus landmarks, academic blocks, gates, and services, offering responsive search, category filtering, and dark/light architectural theming.")
    add_body_p(doc, "• Module 2 — Route Planning Service: A high-performance pathfinding engine executing Dijkstra and A* algorithms over an in-memory spatial graph. Calculates optimal pedestrian paths, estimates walking durations at standard 1.3 m/s human velocity, provides step-free wheelchair accessibility filters, and generates turn-by-turn guidance.")
    add_body_p(doc, "• Module 3 — Visitor Assistance Service: A targeted wayfinding suite featuring optical QR code scanning for physical campus signposts, deep-link parameter validation, lost-visitor assistance ticket submissions, and community map issue reporting.")

    add_body_p(doc, "To maintain technical feasibility within the academic capstone boundaries, explicit project scope boundaries are established:", bold_prefix="Scope Boundaries & Non-Goals: ")
    add_body_p(doc, "1. In-Scope: Pedestrian ground-level navigation across the core academic corridor network (Dataset C: 27 nodes, 29 segments, 15 verified destinations); dual-mode authentication (cookies and JWTs); real-time GPS snapping (<75m); optical QR camera scanning; and administrative operations console (/admin).")
    add_body_p(doc, "2. Out-of-Scope (Excluded): Multi-floor vertical indoor indoor positioning (elevators/stairwells inside blocks); autonomous drone or robotic delivery routing; commercial payment gateways; and vehicle parking space sensor automation.")

    # 1.3 Definitions, Acronyms, and Abbreviations
    add_heading_2(doc, "1.3 Definitions, Acronyms, and Abbreviations")
    add_body_p(doc, "Table 2 defines the formal technical terminology and acronyms applied throughout this specification document.")
    
    def_table = doc.add_table(rows=1, cols=3)
    def_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    def_table.autofit = False
    col_w_def = [Inches(1.2), Inches(2.0), Inches(3.3)]
    set_table_borders(def_table)
    
    hdr = def_table.rows[0]
    hdr.cells[0].paragraphs[0].text = "Term / Acronym"
    hdr.cells[1].paragraphs[0].text = "Full Title"
    hdr.cells[2].paragraphs[0].text = "Technical Meaning within CampusWay Specification"
    style_table_header(hdr, col_w_def)
    
    terms_data = [
        ("WGS84", "World Geodetic System 1984", "Standard ellipsoid coordinate datum (latitude, longitude) utilized for all spatial calculations."),
        ("Argon2id", "Argon2id Password Hashing", "RFC 9106 recommended hybrid memory-hard cryptographic key derivation function."),
        ("Dijkstra", "Dijkstra's Algorithm", "Graph search algorithm computing single-source shortest path using a min-priority queue."),
        ("A* Search", "A* Pathfinding Algorithm", "Heuristic graph search algorithm evaluating f(n) = g(n) + h(n) with admissible Haversine heuristic."),
        ("Haversine", "Haversine Distance Formula", "Spherical trigonometric formula determining great-circle surface distance between coordinates."),
        ("Bearing", "Initial Forward Bearing", "Angle in degrees clockwise from true north between two spherical geographical points."),
        ("RBAC", "Role-Based Access Control", "Security enforcement restricting admin operations based on user role ('student', 'admin')."),
        ("JWT", "JSON Web Token", "Cryptographically signed compact token containing claims (sub, email, role, exp)."),
        ("HttpOnly", "HttpOnly Cookie Flag", "Browser security attribute preventing client-side JavaScript from accessing session tokens."),
        ("Dataset C", "Verified Survey Dataset C", "Canonical ground-truth survey containing 27 nodes, 29 segments, and 15 destinations."),
        ("HUD", "Heads-Up Display", "Floating responsive user interface overlay presenting route turns and direction cards.")
    ]
    for row_t in terms_data:
        r = def_table.add_row()
        for idx, val in enumerate(row_t):
            r.cells[idx].paragraphs[0].text = val
    style_table_rows(def_table, col_w_def)
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 1.4 References
    add_heading_2(doc, "1.4 References")
    add_body_p(doc, "This specification adheres to IEEE software documentation standards and cites official technical specifications for all integrated architectural components. References are cited using standard IEEE bracketed notation [1] - [15].")
    
    ref_table = doc.add_table(rows=1, cols=3)
    ref_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    ref_table.autofit = False
    col_w_ref = [Inches(0.8), Inches(2.5), Inches(3.2)]
    set_table_borders(ref_table)
    
    hdr = ref_table.rows[0]
    hdr.cells[0].paragraphs[0].text = "Ref ID"
    hdr.cells[1].paragraphs[0].text = "Standard / Document Title"
    hdr.cells[2].paragraphs[0].text = "Publication Source & Relevance to Project"
    style_table_header(hdr, col_w_ref)
    
    ref_data = [
        ("[1]", "IEEE Std 830-1998", "IEEE Recommended Practice for Software Requirements Specifications, IEEE Computer Society."),
        ("[2]", "ISO/IEC/IEEE 29148:2018", "Systems and software engineering — Life cycle processes — Requirements engineering."),
        ("[3]", "Dijkstra, E. W. (1959)", "\"A note on two problems in connexion with graphs\", Numerische Mathematik, vol. 1, pp. 269–271."),
        ("[4]", "Hart, Nilsson & Raphael (1968)", "\"A Formal Basis for the Heuristic Determination of Minimum Cost Paths\", IEEE Trans. SSC."),
        ("[5]", "Next.js 16 Documentation", "Vercel Inc., \"App Router, Server Components, and Turbopack Bundling Architecture\", 2026."),
        ("[6]", "React 19 Specification", "Meta Open Source, \"React 19 Server Components and Concurrent UI Hooks\", 2026."),
        ("[7]", "FastAPI Framework Documentation", "Tiangolo, S., \"FastAPI: Modern, Fast Web Framework for Python 3.10+\", 2026."),
        ("[8]", "SQLAlchemy 2.0 Documentation", "Bayer, M., \"SQLAlchemy: The Database Toolkit for Python\", Unified Mapped Architecture, 2026."),
        ("[9]", "Alembic Database Migrations", "Bayer, M., \"Alembic: Lightweight Database Migration Tool for SQLAlchemy\", 2026."),
        ("[10]", "PostgreSQL 16 Documentation", "The PostgreSQL Global Development Group, \"PostgreSQL 16 Relational Database System\", 2026."),
        ("[11]", "Mapbox GL JS v3 Specification", "Mapbox Inc., \"Client-side Vector WebGL Tile Rendering and GeoJSON Styling Engine\", 2026."),
        ("[12]", "RFC 9106 (Argon2id)", "IETF, \"Argon2 Memory-Hard Function for Password Hashing and Proof-of-Work\", 2021."),
        ("[13]", "RFC 7519 (JSON Web Token)", "IETF, \"JSON Web Token (JWT) Architecture and Cryptographic Claims Format\", 2015."),
        ("[14]", "W3C Geolocation API v2", "World Wide Web Consortium, \"Geolocation API Specification — Position and Watcher\", 2024."),
        ("[15]", "W3C WCAG 2.1 Guidelines", "World Wide Web Consortium, \"Web Content Accessibility Guidelines (WCAG) 2.1 Level AA\", 2018.")
    ]
    for row_t in ref_data:
        r = ref_table.add_row()
        for idx, val in enumerate(row_t):
            r.cells[idx].paragraphs[0].text = val
    style_table_rows(ref_table, col_w_ref)
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 1.5 Overview
    add_heading_2(doc, "1.5 Overview of Document Organization")
    add_body_p(doc, "This Software Requirements Specification is structured into five cohesive chapters designed to provide comprehensive technical depth:")
    add_body_p(doc, "• Chapter 1 provides the introductory context, institutional problem definition, boundaries, technical definitions, and formal IEEE standards references.")
    add_body_p(doc, "• Chapter 2 details the general system description, product perspective, module breakdowns, implementation status matrix, user profiles, constraints, assumptions, and dependencies.")
    add_body_p(doc, "• Chapter 3 articulates the core specific requirements, including external user, hardware, software, and communication interfaces, followed by 15 detailed Functional Requirements (FR-001 through FR-015), 6 measurable Non-Functional Requirements (NFR-001 through NFR-006), design constraints, and Dataset C catalog tables.")
    add_body_p(doc, "• Chapter 4 presents formal system analysis models, incorporating Context DFD Level 0, DFD Level 1, DFD Level 2, UML Use Case Diagrams with detailed tabular use case specifications, Multi-Tier System Architecture, Relational Entity-Relationship Diagram (ERD), Activity Diagram, Sequence Diagrams, and the GPS Snapping State Machine.")
    add_body_p(doc, "• Chapter 5 specifies the verified GitHub repository links, active development branch topologies, and complete source code directory hierarchy.")

def build_section_2(doc):
    """Construct Section 2: GENERAL DESCRIPTION."""
    add_heading_1(doc, "2. GENERAL DESCRIPTION")
    
    # 2.1 Product Perspective
    add_heading_2(doc, "2.1 Product Perspective")
    add_body_p(doc, "CampusWay is an autonomous, web-native campus navigation and operational intelligence system operating in modern client web browsers without requiring native mobile application store installation. The platform is architected as a decoupled multi-tier system:")
    add_body_p(doc, "1. Presentation Tier (Client Browser): Built with Next.js 16 (App Router), React 19, and Tailwind CSS v4. Executes client-side routing, renders Mapbox WebGL vector tiles, manages responsive mobile bottom sheets, performs camera optical QR decoding, and coordinates browser Geolocation GPS watchers.")
    add_body_p(doc, "2. Application Services & Gateway Tier (FastAPI): Built with Python 3.13 and FastAPI running under Uvicorn ASGI. Implements JSON REST endpoints, enforces CORS credential policies, validates Pydantic schemas, handles dual-mode session authentication, and executes shortest-path pathfinding algorithms.")
    add_body_p(doc, "3. Spatial Pathfinding Engine: An in-memory, C-optimized graph solver implementing Dijkstra and A* algorithms with an LRU/TTL caching layer to accelerate repeated shortest-path evaluations.")
    add_body_p(doc, "4. Relational Data Persistence Tier: Powered by PostgreSQL (hosted on Neon Serverless Cloud in production) and mirrored in development via SQLite (campusway_dev.db), with relational integrity managed via 6 sequential Alembic migrations.")
    add_body_p(doc, "5. External Geospatial & Hardware Services: Integrates Mapbox GL JS vector tile APIs for base cartography and browser-native W3C Geolocation APIs for client GPS positioning.")

    # 2.2 Product Functions
    add_heading_2(doc, "2.2 Product Functions")
    add_body_p(doc, "CampusWay delivers comprehensive spatial intelligence grouped across its primary operational modules:")
    add_body_p(doc, "1. Campus Map Service: Provides interactive WebGL vector map rendering bounded to LPU coordinates. Allows searching across 15 verified campus POIs, category filtering (Academic, Gate, Hostel, Food, Landmark), interactive marker popups, smooth camera zooming, and an automatic static SVG vector map fallback when WebGL is unavailable.")
    add_body_p(doc, "2. Route Planning Service: Supports origin/destination selection, in-memory graph construction, single-source shortest-path computation via Dijkstra and A* algorithms, step-free wheelchair accessibility filtering, walking time estimation (1.3 m/s), and turn-by-turn directional HUD guidance with initial forward bearings.")
    add_body_p(doc, "3. Real-Time Positioning & Snapping: Connects to device GPS coordinates, filters errant readings (>50m accuracy rejected), snaps pedestrian position to the nearest graph node within 75m, detects unsurveyed areas with cardinal compass directions to the 3 nearest landmarks, and automatically triggers dynamic rerouting when the user drifts >25m off route.")
    add_body_p(doc, "4. Visitor Assistance & QR Wayfinding: Decodes destination-encoded QR signposts via camera scanner, validates deep-link parameters, accepts visitor mobility assistance tickets, and logs community map discrepancy reports.")
    add_body_p(doc, "5. Administrative Operations Workspace (/admin): Restricted operations console providing KPI metrics, user directory management, POI verification, graph diagnostics (detecting isolated nodes and dangling edges), cache purging, and immutable security audit trail logging.")

    add_body_p(doc, "Table 4 provides an honest, empirical implementation matrix distinguishing operational, partially complete, and planned features:", bold_prefix="Implementation Status Matrix: ")
    
    stat_table = doc.add_table(rows=1, cols=4)
    stat_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    stat_table.autofit = False
    col_w_stat = [Inches(1.5), Inches(2.5), Inches(1.2), Inches(1.3)]
    set_table_borders(stat_table)
    
    hdr = stat_table.rows[0]
    hdr.cells[0].paragraphs[0].text = "Functional Module"
    hdr.cells[1].paragraphs[0].text = "Specific Feature Capability"
    hdr.cells[2].paragraphs[0].text = "Status"
    hdr.cells[3].paragraphs[0].text = "Verification Basis"
    style_table_header(hdr, col_w_stat)
    
    matrix_data = [
        ("Authentication", "Email/Password Registration with Argon2id", "Operational", "Unit & Pytest Verified"),
        ("Authentication", "Dual-Mode Sessions (Cookie + Bearer JWT)", "Operational", "Pytest & Browser Verified"),
        ("Authentication", "Google OAuth 2.0 Integration", "Partially Complete", "Requires Prod Client ID"),
        ("Campus Map", "Mapbox GL JS Interactive WebGL Rendering", "Operational", "Verified in Browser"),
        ("Campus Map", "Static SVG Vector Fallback Map", "Operational", "Offline Tested"),
        ("Pathfinding", "Dijkstra & A* Shortest Path Solvers", "Operational", "100% Parity Tested"),
        ("Pathfinding", "Step-Free Wheelchair Accessibility Filter", "Operational", "Tested on Dataset C"),
        ("Pathfinding", "Turn-by-Turn Initial Bearing HUD Guidance", "Operational", "Spherical Math Verified"),
        ("GPS Engine", "Real-Time Snapping to Graph (<75m Threshold)", "Operational", "Vitest Unit Tested"),
        ("GPS Engine", "Unsurveyed Area 3-Landmark Cardinal Guidance", "Operational", "Tested in Mock Panel"),
        ("GPS Engine", "Dynamic Off-Route Automatic Reroute (>25m)", "Operational", "Tested in Mock Panel"),
        ("QR Wayfinding", "In-App Camera Scanner & Deep-Link Resolution", "Operational", "Html5Qrcode Verified"),
        ("QR Wayfinding", "Printable Vector Signpost Sheet Generator", "Operational", "Tested at /admin/qr"),
        ("Admin Console", "Operations Dashboard & KPI Telemetry", "Operational", "Tested at /admin"),
        ("Admin Console", "User Management & Last-Admin Safety Guard", "Operational", "Pytest Invariant Tested"),
        ("Admin Console", "Graph Connectivity Diagnostics & Validation", "Operational", "Tested at /admin/routes"),
        ("Admin Console", "Immutable Security Activity Audit Trail", "Operational", "audit_logs Schema Verified"),
        ("Indoor Wayfinding", "Multi-Floor Vertical Elevator/Stair Routing", "Planned (Future)", "Scope Non-Goal")
    ]
    for row_t in matrix_data:
        r = stat_table.add_row()
        for idx, val in enumerate(row_t):
            r.cells[idx].paragraphs[0].text = val
    style_table_rows(stat_table, col_w_stat)
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 2.3 User Characteristics
    add_heading_2(doc, "2.3 User Characteristics")
    add_body_p(doc, "CampusWay serves five distinct campus user personas, each characterized by specific technical literacy, operational goals, and access privileges as detailed in Table 5.")
    
    user_table = doc.add_table(rows=1, cols=4)
    user_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    user_table.autofit = False
    col_w_user = [Inches(1.4), Inches(1.8), Inches(1.8), Inches(1.5)]
    set_table_borders(user_table)
    
    hdr = user_table.rows[0]
    hdr.cells[0].paragraphs[0].text = "User Persona"
    hdr.cells[1].paragraphs[0].text = "Primary Operational Goal"
    hdr.cells[2].paragraphs[0].text = "Technical Familiarity"
    hdr.cells[3].paragraphs[0].text = "Access Privileges"
    style_table_header(hdr, col_w_user)
    
    user_data = [
        ("General Student", "Find lecture halls, laboratories, food courts, and hostel blocks quickly between classes.", "High (Mobile-native smartphone users; accustomed to consumer map apps).", "Role: 'student' (Public explore map, routing, saved favorites, profile)."),
        ("First-Time Student", "Locate registration centers, administrative blocks (e.g. Block 34), and library without confusion.", "Moderate to High (Requires prominent search, clear visual landmarks, and turn cards).", "Role: 'student' (Public explore map, POI search, turn-by-turn guidance)."),
        ("Campus Visitor / Parent", "Navigate from main campus gates to convocation pavilions, guest houses, or hospitals.", "Low to Moderate (Benefits from optical QR signpost scanning and simple UI).", "Anonymous / Public (Zero-login explore map, QR scanning, assistance request)."),
        ("Mobility-Impaired Pedestrian", "Identify step-free pathways excluding outdoor staircases and steep curbs.", "Moderate (Relies heavily on accurate wheelchair accessibility filters).", "Public / Student (Step-free routing filter, mobility assistance ticket dispatch)."),
        ("System Administrator", "Maintain campus POIs, update spatial graph edges, purge caches, and review audit logs.", "High (Engineering operators and campus facilities IT personnel).", "Role: 'admin' (Exclusive access to /admin workspace and management APIs).")
    ]
    for row_t in user_data:
        r = user_table.add_row()
        for idx, val in enumerate(row_t):
            r.cells[idx].paragraphs[0].text = val
    style_table_rows(user_table, col_w_user)
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 2.4 General Constraints
    add_heading_2(doc, "2.4 General Constraints")
    add_body_p(doc, "The implementation and operational deployment of CampusWay are subject to specific technical and institutional constraints:")
    add_body_p(doc, "1. Campus Survey Data Provenance: All spatial waypoints, junctions, and walkway segments are strictly bounded to verified ground-truth survey data (Nikhil's Dataset C). Coordinates for Block 34 represent a documented survey limitation requiring external verification; the system enforces this limitation and never fabricates speculative coordinates.")
    add_body_p(doc, "2. External Mapping API Quotas: The primary interactive map utilizes Mapbox GL JS under free-tier evaluation limits. To prevent catastrophic failure if quotas are exhausted or WebGL crashes, the system must maintain a 100% operational SVG vector map fallback.")
    add_body_p(doc, "3. Hardware Geolocation Variance: Mobile browser GPS accuracy fluctuates substantially on campus due to tall concrete academic structures (e.g. Block 30-38). The system constrains GPS usage by rejecting accuracy readings coarser than 50 meters and snapping only within a 75-meter corridor.")
    add_body_p(doc, "4. Database Network Isolation: University firewalls occasionally block outbound TCP traffic on PostgreSQL port 5432. To prevent server failure, the backend implements a resilient user repository proxy that falls back automatically to an in-memory repository if port 5432 is unreachable.")
    add_body_p(doc, "5. Modern Browser Standards: CampusWay requires modern ECMAScript 2022+ compliant web browsers supporting HTML5 Canvas, WebGL, Web Cryptography API, and W3C Geolocation API.")

    # 2.5 Assumptions and Dependencies
    add_heading_2(doc, "2.5 Assumptions and Dependencies")
    add_body_p(doc, "The operational viability of the platform relies upon verified technical assumptions:")
    add_body_p(doc, "• Assumption 1: Pedestrian users have access to a smartphone or computing device with an active cellular data or campus Wi-Fi internet connection.")
    add_body_p(doc, "• Assumption 2: Smartphone users consent to standard browser Geolocation permissions to enable real-time GPS position markers and optical camera permissions for QR scanning.")
    add_body_p(doc, "• Dependency 1: Availability of Mapbox GL vector tile servers for cartographic basemap streaming.")
    add_body_p(doc, "• Dependency 2: Neon Serverless PostgreSQL cloud connectivity for production relational persistence.")
    add_body_p(doc, "• Dependency 3: Node.js 18+ runtime environment for Next.js 16 frontend build and execution.")
    add_body_p(doc, "• Dependency 4: Python 3.10+ virtual environment for FastAPI backend execution and SQLAlchemy ORM operations.")

print("Sections 1 and 2 builders configured.")

def build_section_3(doc):
    """Construct Section 3: SPECIFIC REQUIREMENTS."""
    add_heading_1(doc, "3. SPECIFIC REQUIREMENTS")
    add_body_p(doc, "This section defines the complete, testable, and uniquely identified engineering requirements for CampusWay. In accordance with IEEE Std 830-1998, each functional and non-functional requirement is assigned an immutable alphanumeric identifier, priority classification, unambiguous processing steps, exception flows, and acceptance verification criteria.")

    # 3.1 External Interface Requirements
    add_heading_2(doc, "3.1 External Interface Requirements")
    
    # 3.1.1 User Interfaces
    add_heading_3(doc, "3.1.1 User Interfaces")
    add_body_p(doc, "CampusWay implements a responsive, mobile-first design system utilizing Tailwind CSS v4 and custom design tokens adhering to an architectural dark navy (#070B14) / warm off-white (#F6F4EF) / vermilion accent (#E8452C) color identity. Key user interfaces include:")
    add_body_p(doc, "• Architectural Landing Page (/): Features a full-viewport kinetic hero headline, interactive quick-stats ticker, feature overview cards, dynamic campus route simulation, and direct action triggers ('Explore Campus' and 'Find a Route').")
    add_body_p(doc, "• Explore Map Dashboard (/explore): Full-screen interactive map integrating Mapbox GL JS with floating search HUD, category pill filters, POI marker popups, smooth pan-to-location animations, and responsive mobile bottom sheet drawer.")
    add_body_p(doc, "• Navigation HUD & Turn Directions Overlay: Real-time routing overlay displaying total distance in meters, walking duration at 1.3 m/s, accessible step-free toggle, visual step-by-step turn cards with bearing direction icons, and 'Clear Route' action.")
    add_body_p(doc, "• Optical QR Scanner Modal: Clean camera viewfinder with pulsating reticle, device camera selector dropdown, hardware LED torch toggle, photo upload fallback, and manual destination slug input field.")
    add_body_p(doc, "• Developer GPS Mock Controller: Floating collapsible testing console allowing developers and evaluators to inject synthetic coordinates, simulate walking speed, or jump instantly to surveyed waypoints (Block 34, Central Library, Gates).")
    add_body_p(doc, "• Administrative Control Centre (/admin): Dedicated operational console featuring independent left navigation sidebar, breadcrumb hierarchy, KPI telemetry metric cards, searchable user table with role elevation modal, POI CRUD manager, graph connectivity validator, and immutable audit log viewer.")

    # 3.1.2 Hardware Interfaces
    add_heading_3(doc, "3.1.2 Hardware Interfaces")
    add_body_p(doc, "CampusWay interfaces with client device hardware through standardized W3C browser APIs:")
    add_body_p(doc, "1. Smartphone & Tablet Touchscreens: Handles multi-touch gestures (pinch-to-zoom, two-finger pitch/bearing rotation, single-finger drag/pan) on capacitive touch displays.")
    add_body_p(doc, "2. Integrated GPS Receivers: Communicates with smartphone satellite GNSS/GPS chips via navigator.geolocation.watchPosition() to receive WGS84 latitude, longitude, heading, and accuracy radius.")
    add_body_p(doc, "3. Rear Camera Hardware: Interfaces with smartphone optical camera sensors via navigator.mediaDevices.getUserMedia() to stream live 1080p/720p video frames to the Html5Qrcode optical decoder.")
    add_body_p(doc, "4. Camera Flashlight / Torch: Sends hardware torch control commands via MediaStreamTrack.applyConstraints({ advanced: [{ torch: true }] }) to illuminate physical signposts in low-light night conditions.")

    # 3.1.3 Software Interfaces
    add_heading_3(doc, "3.1.3 Software Interfaces")
    add_body_p(doc, "Table 6 enumerates the verified software framework dependencies, libraries, and external cloud services integrated into the active CampusWay codebase.")
    
    soft_table = doc.add_table(rows=1, cols=4)
    soft_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    soft_table.autofit = False
    col_w_soft = [Inches(1.5), Inches(1.2), Inches(2.3), Inches(1.5)]
    set_table_borders(soft_table)
    
    hdr = soft_table.rows[0]
    hdr.cells[0].paragraphs[0].text = "Component / Service"
    hdr.cells[1].paragraphs[0].text = "Version"
    hdr.cells[2].paragraphs[0].text = "Technical Purpose & Integration Scope"
    hdr.cells[3].paragraphs[0].text = "Architecture Tier"
    style_table_header(hdr, col_w_soft)
    
    soft_data = [
        ("Next.js App Router", "16.4.6", "React framework with Turbopack bundler for SSR and client routing.", "Frontend Client"),
        ("React", "19.0.0", "Core declarative UI library with concurrent rendering and hooks.", "Frontend Client"),
        ("Tailwind CSS", "4.0.0", "Utility-first CSS framework for semantic design tokens and layout.", "Frontend Styling"),
        ("Mapbox GL JS", "3.19.0", "Client-side WebGL vector tile mapping and GeoJSON styling.", "Frontend Geospatial"),
        ("Html5Qrcode", "2.3.8", "Optical 2D matrix barcode scanner engine with camera access.", "Frontend Media"),
        ("FastAPI", "0.110.0+", "High-performance Python ASGI web framework for REST API endpoints.", "Backend Gateway"),
        ("SQLAlchemy", "2.0.28+", "Unified Python ORM toolkit for relational queries and connection pooling.", "Backend Persistence"),
        ("Alembic", "1.13.1+", "Database schema migration engine managing migrations 001 to 006.", "Backend Database"),
        ("PostgreSQL (Neon)", "16.0", "Serverless cloud relational database hosting production campus data.", "Data Storage"),
        ("SQLite", "3.45+", "Embedded relational database supporting zero-network local development.", "Dev Storage"),
        ("Passlib (Argon2)", "1.7.4", "RFC 9106 Argon2id cryptographic password hashing implementation.", "Backend Security"),
        ("Python-Jose", "3.3.0", "RFC 7519 JSON Web Token signing and cryptographic verification.", "Backend Auth")
    ]
    for row_t in soft_data:
        r = soft_table.add_row()
        for idx, val in enumerate(row_t):
            r.cells[idx].paragraphs[0].text = val
    style_table_rows(soft_table, col_w_soft)
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 3.1.4 Communications Interfaces
    add_heading_3(doc, "3.1.4 Communications Interfaces")
    add_body_p(doc, "All network communications adhere to strict RESTful design standards over encrypted Transport Layer Security (TLS 1.3 / HTTPS):")
    add_body_p(doc, "1. HTTP / HTTPS Protocols: Client-to-server traffic is conducted using standard HTTP methods (GET, POST, PATCH, PUT, DELETE). GZip compression middleware is enforced on all payloads exceeding 1,000 bytes.")
    add_body_p(doc, "2. JSON Serialization: Payloads conform strictly to application/json MIME type, validated on input and output through Pydantic v2 data models.")
    add_body_p(doc, "3. CORS & Credential Policy: Cross-Origin Resource Sharing (CORS) explicitly whitelists the frontend origins (http://localhost:3000, https://campusway.lpu.in), with allow_credentials=True allowing authenticated session cookies.")
    add_body_p(doc, "4. Session Cookie Transmission: Browser sessions use the campusway_session cookie formatted with HttpOnly, Secure (in production), and SameSite=Lax flags to neutralize Cross-Site Scripting (XSS) and CSRF attacks.")

    # 3.2 Functional Requirements
    add_heading_2(doc, "3.2 Functional Requirements")
    add_body_p(doc, "The following 15 Functional Requirements (FR-001 through FR-015) define the complete functional capabilities of CampusWay. Every requirement specifies preconditions, processing algorithms, outputs, error handling, and verification methods.")

    # FR-001
    add_requirement_card(
        doc, "FR-001", "User Account Registration", "High",
        "The system shall allow new campus users (students, faculty) to register an account using a valid email address, full name, and secure password.",
        "Full Name (string, 1-120 chars), Email (RFC 5322 string), Password (string, min 8 chars).",
        "1. Normalize email to lowercase and trim whitespace.\n2. Query database for existing email (uniqueness check).\n3. Hash password using Argon2id algorithm (time_cost=2, memory_cost=65536, parallelism=1).\n4. Persist User and UserCredential records in a single transactional database commit.\n5. Issue session cookie and JWT access token.",
        "HTTP 201 Created with UserResponse JSON and Set-Cookie: campusway_session header.",
        "If email already exists: Return HTTP 400 Bad Request ('An account with this email address already exists'). If password < 8 chars: Return HTTP 422 Unprocessable Entity.",
        "Client device has network connectivity to FastAPI backend; user is unauthenticated.",
        "New user profile and Argon2id credential records are committed to the users and user_credentials tables.",
        "User account is created; subsequent login with the identical credentials succeeds.",
        "Automated pytest test_email_password_auth.py::test_registration_success"
    )

    # FR-002
    add_requirement_card(
        doc, "FR-002", "Dual-Mode User Authentication & Login", "Critical",
        "The system shall authenticate registered users using email and password, issuing both an HttpOnly web session cookie and a signed Bearer JWT token.",
        "Email (string), Password (string), remember_me (boolean, optional).",
        "1. Normalize email and query users table for active account.\n2. Fetch password_hash from user_credentials table.\n3. Execute constant-time password verification via verify_password().\n4. Generate crypto-random 32-byte raw session token.\n5. Compute SHA-256 hash of token and insert into user_sessions table.\n6. Generate JWT containing sub=user_id, email, and role claims.\n7. Attach session cookie (max_age=30 days if remember_me else 1 day).",
        "HTTP 200 OK with UserResponse JSON and HttpOnly campusway_session cookie.",
        "If email not found or password incorrect: Return HTTP 401 Unauthorized ('Invalid email or password.'). If account deactivated: Return HTTP 403 Forbidden.",
        "User account exists in database and is_active is true.",
        "Authenticated session recorded in user_sessions; client receives session cookie and JWT.",
        "Client enters credentials; receives HTTP 200; refreshUser() loads full profile with correct role.",
        "Automated pytest test_email_password_auth.py::test_login_success & Browser E2E"
    )

    # FR-003
    add_requirement_card(
        doc, "FR-003", "Session Management & Revocation", "High",
        "The system shall validate active session cookies on protected endpoints and permit complete session revocation upon user logout.",
        "Cookie campusway_session or Header Authorization: Bearer <token>.",
        "1. Extract token_hash from cookie or decode JWT payload.\n2. Query user_sessions table to verify session exists and is_revoked is false.\n3. Verify session expires_at is in the future.\n4. On logout request: Set is_revoked = true in user_sessions and issue expired cookie.",
        "HTTP 200 OK with LogoutResponse JSON and Set-Cookie clearing campusway_session.",
        "If session expired or revoked: Return HTTP 401 Unauthorized ('Session expired or invalid').",
        "Client possesses an active, unrevoked session cookie or JWT token.",
        "Session record marked revoked in database; client cookie cleared; subsequent calls return 401.",
        "Calling /api/v1/auth/me after logout returns HTTP 401 Unauthorized.",
        "Automated pytest test_session_security.py::test_logout_revokes_session"
    )

    # FR-004
    add_requirement_card(
        doc, "FR-004", "Role-Based Access Control & Admin Protection", "Critical",
        "The system shall enforce role-based authorization restricting access to /admin routes and /api/v1/admin/* endpoints strictly to users with role == 'admin'.",
        "HTTP Request to /admin or /api/v1/admin/* carrying session cookie or Authorization header.",
        "1. Middleware dependencies.require_admin_role intercepts incoming request.\n2. Checks static X-Admin-Key against settings.ADMIN_API_KEY.\n3. Decodes JWT or extracts session token to resolve acting user ID.\n4. Verifies resolved user has role == 'admin' and is_active == true.\n5. On frontend: AdminGuard intercepts navigation and renders 403 Forbidden if role != 'admin'.",
        "Execution allowed for admin; HTTP 403 Forbidden card rendered for non-admin users.",
        "If client unauthenticated: Return HTTP 401 Unauthorized. If role != 'admin': Return HTTP 403 Forbidden ('Access forbidden: Insufficient administrative privileges').",
        "User is authenticated; request target requires administrative role.",
        "Administrative operation executed or rejected based on strict role check.",
        "Standard student account cannot load /admin or invoke administrative APIs.",
        "Automated pytest test_admin_auth.py::test_student_forbidden_from_admin_dashboard"
    )

    # FR-005
    add_requirement_card(
        doc, "FR-005", "Last-Administrator Demotion & Deactivation Guard", "Critical",
        "The system shall enforce a strict safety invariant preventing the sole remaining active administrator from being demoted to student or deactivated.",
        "User ID (UUID), target role (string) or target is_active (boolean).",
        "1. Intercept PATCH /api/v1/admin/users/{user_id}/role or /status.\n2. Fetch target user record from repository.\n3. If target user is an admin and request attempts demotion or deactivation:\n4. Query total count of active administrators across the system.\n5. If active admin count <= 1: Raise ValueError('Cannot demote/deactivate the last active administrator').",
        "HTTP 400 Bad Request with explanatory detail message.",
        "HTTP 400 Bad Request detail: 'Cannot demote the last active administrator.'",
        "Target user has role == 'admin' and is_active == true; exactly one active admin exists.",
        "System maintains at least one active administrator at all times; database state unchanged.",
        "Attempting to demote sole admin returns HTTP 400; role remains 'admin'.",
        "Automated pytest test_admin_auth.py::test_cannot_demote_last_administrator"
    )

    # FR-006
    add_requirement_card(
        doc, "FR-006", "Interactive Campus Map Display & Vector Fallback", "High",
        "The system shall render an interactive WebGL vector map centered at LPU, with automatic static SVG vector map fallback if WebGL fails.",
        "Map viewport container, Basemap style selector ('dark', 'streets', 'satellite', 'blueprint').",
        "1. Check client browser for WebGL support and valid Mapbox access token.\n2. If WebGL active: Initialize Mapbox GL JS map instance centered at [75.7037, 31.2536].\n3. Restrict viewport to LPU campus bounds [75.6940, 31.2460, 75.7140, 31.2640], zoom 14-19.\n4. If WebGL fails or crashes: Catch error and mount SvgCampusMap vector fallback automatically.\n5. Load POI markers, route polylines, and GPS location markers onto active map canvas.",
        "Interactive canvas displaying LPU campus layout, road networks, and POI markers.",
        "If Mapbox initialization throws: Log error and seamlessly mount SVG fallback component.",
        "Client browser loaded at /explore or homepage navigation container.",
        "Map rendered with markers, popups, and zoom controls.",
        "Map loads within 2 seconds; vector fallback displays if token is missing.",
        "Browser UI Acceptance & Vitest mapViewport.test.ts"
    )

    # FR-007
    add_requirement_card(
        doc, "FR-007", "Campus POI Location Discovery & Text Search", "High",
        "The system shall allow users to search campus points of interest by name, acronym, category, or short code with instant filtering.",
        "Search query string (e.g. 'Block 34', 'Library', 'Food'), Category filter.",
        "1. Filter canonical location list matching query substring against name, slug, aliases, and building code.\n2. Prioritize exact prefix matches, followed by category matches.\n3. Return top matching locations with category badge, description, and coordinates.\n4. On POI selection: Smoothly pan map camera to coordinates and open information card.",
        "List of filtered POI cards; map camera centered on selected destination.",
        "If no locations match: Display empty state message ('No campus locations found matching query').",
        "Campus location dataset loaded in memory or retrieved from /api/v1/locations/.",
        "Search results displayed; selecting a location populates route destination field.",
        "Searching 'Block 34' returns Block 34 POI; clicking pans map to coordinates.",
        "Vitest useDebounce.test.ts & locationService.test.ts"
    )

    # FR-008
    add_requirement_card(
        doc, "FR-008", "Shortest-Path Calculation via Dijkstra & A*", "Critical",
        "The system shall calculate the optimal, shortest pedestrian route between any two active campus nodes using Dijkstra and A* graph algorithms.",
        "Origin Node ID (UUID/String), Destination Node ID (UUID/String), accessible_only (boolean).",
        "1. Verify origin and destination node IDs exist and are active in graph.\n2. Check in-memory LRU route cache for identical (origin, dest, accessible_only) tuple.\n3. If cache miss: Initialize min-priority queue (heapq).\n4. Relax adjacent edges: tentative_dist = current_dist + edge_weight.\n5. If A* selected: Add Haversine straight-line heuristic h(n) to evaluation function f(n) = g(n) + h(n).\n6. Backtrack predecessors from destination to origin to reconstruct path.\n7. Store result in route cache with 5-minute TTL.",
        "RouteResponse JSON containing total distance (meters), path node sequence, and polyline coordinates.",
        "If origin or destination node does not exist: Return HTTP 404 Not Found ('Routing node not found'). If no path exists: Return HTTP 404 ('No connecting path found').",
        "Origin and destination nodes exist in the active graph topology.",
        "Shortest path calculated; route polyline delivered to client in <50ms.",
        "Dijkstra and A* yield 100% identical shortest path distance on Dataset C.",
        "Pytest test_routing_algorithms.py & Parity Suite"
    )

    # FR-009
    add_requirement_card(
        doc, "FR-009", "Step-Free Accessibility Routing Filter", "High",
        "The system shall provide a toggleable accessibility filter that excludes non-step-free walkways (staircases, steep curbs) from pathfinding.",
        "accessible_only=true flag in route calculation query.",
        "1. Pathfinding loop inspects is_accessible attribute on every examined edge.\n2. If accessible_only is true and edge.is_accessible is false: Discard edge from priority queue relaxation.\n3. Backtrack reconstructed path traversing exclusively step-free walkways.\n4. Mark route response with accessible_route: true flag.",
        "Step-free RouteResponse avoiding all surveyed outdoor staircases.",
        "If no step-free path exists: Return HTTP 404 with detail 'No wheelchair-accessible path available between these locations.'",
        "Active campus graph contains edges with is_accessible flags set.",
        "Calculated route traverses exclusively wheelchair-friendly pathways.",
        "With accessible_only=true, staircase segments (e.g. outdoor steps) are skipped.",
        "Automated pytest test_accessible_routing.py"
    )

    # FR-010
    add_requirement_card(
        doc, "FR-010", "Turn-by-Turn Guidance & Walking Time Estimation", "High",
        "The system shall generate human-readable turn guidance cards and estimate walking travel duration based on a standard pedestrian velocity.",
        "Sequence of consecutive path waypoints [N0, N1, N2...].",
        "1. For each consecutive node pair, compute initial forward bearing θ using spherical trigonometry:\n   y = sin(Δλ)cos(φ2), x = cos(φ1)sin(φ2) - sin(φ1)cos(φ2)cos(Δλ), θ = atan2(y, x).\n2. Calculate angle delta Δθ = (θcurr - θprev + 360) mod 360.\n3. Classify turn instruction: Straight (Δθ <= 45°), Right (45° < Δθ <= 135°), Left (225° < Δθ <= 315°), U-Turn (135° < Δθ <= 225°).\n4. Estimate walking duration: time_seconds = total_distance_meters / 1.3 m/s.",
        "Array of turn step objects with direction, street name, step distance, and total walking duration in minutes.",
        "If path contains < 2 nodes: Return single arrival step ('You have arrived at your destination').",
        "Shortest-path node sequence successfully reconstructed.",
        "Client displays turn-by-turn instruction HUD overlay on the active map.",
        "A 390m route calculates exactly 300 seconds (5.0 minutes) duration.",
        "Vitest routeFormatting.test.ts"
    )

    # FR-011
    add_requirement_card(
        doc, "FR-011", "Real-Time GPS Positioning & Graph Snapping", "High",
        "The system shall capture user GPS coordinates via browser Geolocation and snap the pedestrian position to the nearest graph node within 75 meters.",
        "Browser Geolocation position (latitude, longitude, accuracy).",
        "1. Filter incoming GPS reading: If accuracy > 50m, reject reading and display 'Low Accuracy' indicator.\n2. Verify coordinates lie within LPU campus boundary box.\n3. Compute Haversine distance from position to all active graph nodes.\n4. If minimum distance <= 75m: Snap position to closest Node ID and set snap_status = 'snapped'.\n5. If user clicks 'Get Directions', auto-populate origin with snapped Node ID.",
        "Pulsing blue dot on map; snapped node ID passed to routing engine as origin.",
        "If accuracy > 50m: Show amber accuracy circle; do not snap. If position outside campus: Set snap_status = 'out_of_range'.",
        "User grants browser Geolocation permission; device GPS receiver active.",
        "Pedestrian position accurately aligned to verified campus corridor network.",
        "Device at Block 34 entrance snaps to node N-001 within 75m threshold.",
        "Vitest gpsSnapping.test.ts"
    )

    # FR-012
    add_requirement_card(
        doc, "FR-012", "Unsurveyed Area Guidance & Landmark Bearings", "Medium",
        "The system shall detect when a pedestrian is inside campus but outside surveyed corridor coverage (>75m), displaying distance and compass directions to the 3 nearest landmarks.",
        "User GPS coordinates inside campus, distance to nearest node > 75m.",
        "1. Evaluate snapToNearestNode(): Minimum node distance exceeds 75m threshold.\n2. Query all verified campus landmarks.\n3. Calculate Haversine distance and forward bearing from user coordinates to each landmark.\n4. Sort landmarks by distance ascending and select the top 3.\n5. Convert bearing angles into 8-cardinal compass labels (N, NE, E, SE, S, SW, W, NW).",
        "Unsurveyed Area HUD displaying: 'You are in an unsurveyed campus area. Walk toward: (1) Central Library (180m NE), (2) Block 34 (220m W)...'",
        "If user moves back within 75m: Automatically transition status back to 'snapped'.",
        "User is physically located inside LPU campus boundaries.",
        "User receives directional orientation to safely walk toward surveyed pathways.",
        "Simulating coordinates 100m north of corridor triggers 3 landmark guidance cards.",
        "Vitest gpsSnapping.test.ts & Developer Mock Panel"
    )

    # FR-013
    add_requirement_card(
        doc, "FR-013", "Dynamic Off-Route Automatic Rerouting", "High",
        "The system shall detect when an actively navigating pedestrian drifts more than 25 meters away from the active route polyline and trigger background rerouting.",
        "Active route polyline coordinates, updated GPS position stream.",
        "1. During active navigation, compute perpendicular distance from current GPS position to nearest polyline line segment.\n2. If drift distance > 25 meters:\n3. Snap current GPS coordinates to nearest graph node.\n4. Dispatch background request to /api/v1/routing/calculate with origin = new_node_id and destination = original_destination_id.\n5. Seamlessly replace route polyline on map canvas and update turn cards.",
        "Updated route polyline drawn from current location to target destination.",
        "If no path exists from drifted position: Display alert 'Unable to recalculate route; please return to walkway.'",
        "User is actively navigating a calculated route; GPS watchPosition is running.",
        "Route dynamically recomputed without requiring manual user button clicks.",
        "Injecting coordinate 30m off active path triggers instant route recomputation.",
        "Vitest gpsSnapping.test.ts & Mock Location Controller"
    )

    # FR-014
    add_requirement_card(
        doc, "FR-014", "Optical QR Code Wayfinding & Deep Linking", "High",
        "The system shall optically scan destination-encoded physical QR signposts via camera and resolve deep-link parameters to launch navigation.",
        "Camera video frame feed, QR matrix barcode data.",
        "1. Html5Qrcode captures video frames and detects QR matrix code.\n2. Decode URL payload (e.g. 'https://campusway.lpu.in/navigate?to=block-34').\n3. Sanitize query string: strip control chars, enforce 100-character max length.\n4. Validate destination slug against verified Dataset C locations.\n5. Redirect client to /explore with destination pre-selected, auto-launching route calculation.",
        "Immediate transition to map view showing highlighted route to scanned destination.",
        "If QR code contains invalid or unknown slug: Display warning 'Unknown destination code; please select from campus map.'",
        "User grants optical camera permission; QR signpost barcode is legible.",
        "Physical signpost scan launches accurate digital navigation in < 1 second.",
        "Scanning QR signpost for 'block-34' loads route with destination = Block 34.",
        "Vitest qrNavigation.test.ts & Camera Scanner Acceptance"
    )

    # FR-015
    add_requirement_card(
        doc, "FR-015", "Administrative Operations & Security Audit Logging", "Critical",
        "The system shall provide an administrative control centre to manage users, locations, and graph data, recording immutable security audit trail logs.",
        "Admin user request to modify user role, toggle account status, or clear route cache.",
        "1. Validate acting user has role == 'admin'.\n2. Execute requested database operation (e.g. update user role in users table).\n3. In same transaction, construct AuditLog entity recording timestamp, action ('user.role_change'), entity_type, entity_id, actor_email, client_ip, and sanitized details JSON.\n4. Commit audit entry to immutable audit_logs database table.",
        "HTTP 200 OK with updated entity data; persistent log record created in audit_logs.",
        "If actor is not admin: Reject with HTTP 403 Forbidden; log unauthorized attempt.",
        "Client is authenticated with valid administrative session cookie or JWT.",
        "Administrative modification applied; audit trail permanently recorded.",
        "Changing user role creates row in audit_logs with actor email and timestamp.",
        "Automated pytest test_admin_auth.py::test_role_change_records_audit_trail"
    )

    # 3.5 Non-Functional Requirements
    add_heading_2(doc, "3.5 Non-Functional Requirements")
    add_body_p(doc, "CampusWay enforces rigorous, measurable non-functional requirements (NFR-001 through NFR-006) governing performance, reliability, availability, security, maintainability, and portability. Table 7 summarizes quantitative metric thresholds.")
    
    nfr_table = doc.add_table(rows=1, cols=4)
    nfr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    nfr_table.autofit = False
    col_w_nfr = [Inches(1.0), Inches(2.2), Inches(1.8), Inches(1.5)]
    set_table_borders(nfr_table)
    
    hdr = nfr_table.rows[0]
    hdr.cells[0].paragraphs[0].text = "ID"
    hdr.cells[1].paragraphs[0].text = "NFR Category & Dimension"
    hdr.cells[2].paragraphs[0].text = "Quantitative Acceptance Threshold"
    hdr.cells[3].paragraphs[0].text = "Empirical Status"
    style_table_header(hdr, col_w_nfr)
    
    nfr_data = [
        ("NFR-001", "Performance: Route Computation Latency", "Uncached query <= 50ms; Cached query <= 2ms", "Verified (Avg 12ms uncached, <1ms cached)"),
        ("NFR-001", "Performance: Initial Page Load (LCP)", "Largest Contentful Paint <= 2.0s on 4G connection", "Verified (Turbopack 1.5s initial load)"),
        ("NFR-002", "Reliability: WebGIS Map Fallback", "100% vector SVG fallback if WebGL fails", "Verified (Zero blank map states)"),
        ("NFR-002", "Reliability: User Store Fallback Proxy", "Resilient in-memory fallback if port 5432 blocked", "Verified (Zero server crash on offline DB)"),
        ("NFR-003", "Availability: Operational Service Uptime", "99.9% target uptime during academic operational hours", "Architectural SLA Target"),
        ("NFR-004", "Security: Password Hashing Cryptography", "Argon2id memory-hard key derivation (t=2, m=64MB)", "Verified (RFC 9106 compliant)"),
        ("NFR-004", "Security: Session Cookie Hardening", "HttpOnly, SameSite=Lax, Secure flags enforced", "Verified (Zero script token leakage)"),
        ("NFR-005", "Maintainability: Automated Test Suite Coverage", "Zero test regressions across backend and frontend", "Verified (109 backend + 69 frontend passing)"),
        ("NFR-006", "Portability: Viewport & Cross-Browser", "Responsive 360px to 4K; Chrome, Safari, Firefox, Edge", "Verified (Zero layout breaks across viewports)")
    ]
    for row_t in nfr_data:
        r = nfr_table.add_row()
        for idx, val in enumerate(row_t):
            r.cells[idx].paragraphs[0].text = val
    style_table_rows(nfr_table, col_w_nfr)
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 3.7 Design Constraints
    add_heading_2(doc, "3.7 Design Constraints")
    add_body_p(doc, "The technical architecture of CampusWay is constrained by several institutional and software engineering parameters:")
    add_body_p(doc, "• Technological Stack Constraint: The frontend must execute under Next.js 16 with React 19 and Tailwind CSS v4; the backend must utilize FastAPI with SQLAlchemy 2.0 and Pydantic v2 schemas.")
    add_body_p(doc, "• Relational Database Constraint: Database schema alterations must be managed strictly through Alembic migration scripts, ensuring repeatable schema evolution without data loss.")
    add_body_p(doc, "• Architectural Consistency: The administrative workspace must reside under the /admin route group with its own dedicated layout and navigation, sharing authentication and models without duplicating backend services.")

    # 3.9 Other Specialized Requirements
    add_heading_2(doc, "3.9 Other Specialized Requirements")
    add_body_p(doc, "• Data Provenance of Dataset C: The campus corridor graph is derived strictly from ground-truth survey measurements. Tables 8 and 9 catalog the canonical waypoint nodes and walkway segments established by Nikhil's Dataset C.")
    
    # Dataset C Summary Catalog
    add_body_p(doc, "Dataset C Topology Summary: 27 Spatial Nodes (12 junctions J-001 to J-012, 11 building entrances, 2 main gates, 1 parking, 1 landmark) and 29 bidirectional walkway segments (P-001 to P-029). Block 34 coordinates represent a documented survey limitation requiring external verification; the system enforces this limitation and never fabricates speculative coordinates.", bold_prefix="Spatial Dataset Topology: ")

print("Section 3 builder configured.")

def build_section_4(doc):
    """Construct Section 4: ANALYSIS MODELS with embedded high-resolution figures."""
    add_heading_1(doc, "4. ANALYSIS MODELS")
    add_body_p(doc, "This chapter articulates the structural, functional, behavioral, and relational analysis models of CampusWay. In compliance with IEEE software engineering standards, every diagram is accompanied by formal figure numbering, descriptive titles, architectural context, and cross-references to corresponding functional requirements.")

    # 4.1 Data Flow Diagrams
    add_heading_2(doc, "4.1 Data Flow Diagrams (DFDs)")
    
    # 4.1.1 DFD Level 0
    add_heading_3(doc, "4.1.1 Context-Level Data Flow Diagram (DFD Level 0)")
    add_body_p(doc, "The Context-Level Data Flow Diagram (DFD Level 0) defines the primary scope and operational boundary of CampusWay, illustrating information exchange between the central system process (0.0) and external entities: the Campus Pedestrian, the System Administrator, Mapbox GL Services, and the device Geolocation API.")
    add_figure_image(doc, "dfd_level_0.png", "1", "Context-Level Data Flow Diagram (DFD Level 0) — System Boundary & External Entities")
    add_body_p(doc, "As modeled in Figure 1, the Campus Pedestrian supplies search queries, origin/destination selections, device GPS coordinates, and optical QR scans, receiving interactive vector maps, shortest-path polylines, and turn-by-turn guidance cards. The System Administrator transmits administrative credentials, POI updates, walkway graph modifications, and cache flush requests, receiving real-time KPI metrics, connectivity diagnostics, and immutable audit logs. The Mapbox API provides base vector tiles and font glyphs, while the device Geolocation API provides WGS84 coordinates filtered to <=50m accuracy.")

    # 4.1.2 DFD Level 1
    add_heading_3(doc, "4.1.2 Data Flow Diagram Level 1 (Subsystem Decomposition)")
    add_body_p(doc, "The Level 1 Data Flow Diagram decomposes the system into six core operational processes (1.0 to 6.0) and maps their read/write interactions with five persistent data stores (D1 to D5).")
    add_figure_image(doc, "dfd_level_1.png", "2", "Data Flow Diagram Level 1 — Subsystem Functional Decomposition (Processes 1.0 - 6.0 & Data Stores D1 - D5)")
    add_body_p(doc, "The six Level 1 processes correspond directly to system architectural subsystems: Process 1.0 (Authenticate User) validates credentials against D1 (users & sessions); Process 2.0 (Location Catalog) queries D2 (locations & aliases); Process 3.0 (Routing Engine) retrieves topology from D3 (nodes & edges); Process 4.0 (Spatial Snapper) maps GPS positions to D3 nodes; Process 5.0 (QR Wayfinding) resolves physical signpost scans; and Process 6.0 (Admin Console) updates POIs and writes immutable records to D4 (audit_logs) and triages D5 (reports & tickets).")

    # 4.1.3 DFD Level 2
    add_heading_3(doc, "4.1.3 Data Flow Diagram Level 2 (Pathfinding Subsystem)")
    add_body_p(doc, "The Level 2 Data Flow Diagram details the internal data transformations occurring within Process 3.0 (Compute Shortest Path).")
    add_figure_image(doc, "dfd_level_2.png", "3", "Data Flow Diagram Level 2 — Shortest Path Computation and Turn HUD Guidance Generation")
    add_body_p(doc, "As shown in Figure 3, the pathfinding pipeline executes sequentially through sub-processes: 3.1 verifies endpoint node IDs; 3.2 inspects the in-memory LRU route cache (returning cached responses in <1ms on cache hits); 3.3 executes Dijkstra or A* priority queue relaxation; 3.4 backtracks the predecessor tree; 3.5 derives geographic bearings and turn angles; and 3.6 constructs the final RouteResponse GeoJSON payload delivered to the client.")

    # 4.2 Additional Analysis Models
    add_heading_2(doc, "4.2 Additional Analysis Models")
    
    # 4.2.1 Use Case Diagram
    add_heading_3(doc, "4.2.1 UML Use Case Diagram & Descriptions")
    add_body_p(doc, "Figure 4 presents the complete UML Use Case Diagram illustrating actor boundaries and system capabilities.")
    add_figure_image(doc, "use_case_diagram.png", "4", "UML Use Case Diagram — System Actor Roles and Functional Boundaries")
    
    add_body_p(doc, "The following subsections detail the formal specification for each operational use case workflow, articulating primary actors, triggers, preconditions, main success scenarios, and alternative error branches:", bold_prefix="Operational Use Case Specifications: ")
    
    # UC Table 11
    add_requirement_card(
        doc, "UC-01", "User Sign-In & Authentication", "Critical",
        "Registered student or administrator signs into CampusWay to establish an authenticated session.",
        "Email address, password, remember_me checkbox.",
        "System queries user credentials, verifies Argon2id password hash, issues campusway_session cookie and signed JWT.",
        "User profile displayed; navigation redirects to target destination or /admin workspace.",
        "HTTP 401 Unauthorized ('Invalid email or password.')",
        "User account exists and is_active is true.",
        "Session recorded in user_sessions; authenticated state set in AuthContext.",
        "User successfully authenticated; role-appropriate interface loaded.",
        "Automated pytest test_email_password_auth.py"
    )
    
    # UC Table 12
    add_requirement_card(
        doc, "UC-02", "Campus POI Search & Discovery", "High",
        "Pedestrian searches for campus destinations (e.g. Block 34, Central Library) and views location details.",
        "Text search string, category pill selection.",
        "System executes debounced substring matching across POI names, slugs, and aliases, ranking exact matches first.",
        "Filtered list of POI cards; map camera pans smoothly to selected landmark coordinates.",
        "Empty state card displayed if zero matches found.",
        "Campus location dataset loaded in memory or retrieved from API.",
        "Destination selected; destination node ID set in routing store.",
        "Typing 'Block 34' centers map camera on Block 34 coordinates.",
        "Vitest useDebounce.test.ts & locationService.test.ts"
    )

    # UC Table 13
    add_requirement_card(
        doc, "UC-03", "Shortest-Path Pedestrian Route Calculation", "Critical",
        "Pedestrian calculates optimal path between origin and destination with step-free accessibility filter.",
        "Origin Node ID, Destination Node ID, accessible_only toggle.",
        "System queries graph cache, relaxes walkway edges using Dijkstra/A*, computes spherical bearings and walking time (1.3 m/s).",
        "Highlighted route polyline drawn on map canvas; turn-by-turn guidance cards displayed in HUD.",
        "HTTP 404 Not Found if nodes disconnected or inaccessible.",
        "Origin and destination nodes exist in the active graph topology.",
        "Route polyline rendered; total distance and duration displayed.",
        "Shortest path calculated in <50ms with 100% Dijkstra/A* parity.",
        "Pytest test_routing_algorithms.py"
    )

    # UC Table 14
    add_requirement_card(
        doc, "UC-04", "Optical QR Signpost Wayfinding", "High",
        "Visitor scans physical campus signpost QR code to launch direct navigation.",
        "Camera video frame feed, optical 2D barcode data.",
        "Html5Qrcode decodes matrix barcode, sanitizes deep-link query string, validates slug against Dataset C, and launches navigation.",
        "Browser opens /explore with destination pre-selected, automatically calculating route.",
        "Warning message displayed if QR code contains unknown slug.",
        "Device optical camera permission granted; signpost QR code visible.",
        "Instant route guidance active without requiring manual destination typing.",
        "Scanning signpost QR opens route to target destination in <1s.",
        "Vitest qrNavigation.test.ts"
    )

    # UC Table 15
    add_requirement_card(
        doc, "UC-05", "Real-Time GPS Snapping & Off-Route Guidance", "High",
        "Pedestrian tracks position on campus with automatic snapping to walkway graph and dynamic rerouting.",
        "WGS84 GPS coordinates from browser Geolocation API.",
        "Filters readings >50m accuracy, snaps to nearest node within 75m, detects unsurveyed areas, triggers reroute if drift >25m.",
        "Pulsing blue dot marker on map; updated route polyline on off-route drift.",
        "Low accuracy amber indicator if GPS reading coarser than 50m.",
        "User grants Geolocation permission; device GPS receiver active.",
        "Pedestrian position accurately aligned to verified campus walkways.",
        "Drifting >25m off route recalculates path automatically.",
        "Vitest gpsSnapping.test.ts"
    )

    # UC Table 16
    add_requirement_card(
        doc, "UC-06", "Administrative Governance & Security Audit Logging", "Critical",
        "Campus operator manages user accounts, POI metadata, and graph topology, recording immutable audit trails.",
        "Admin user action (e.g. role change, POI update, cache flush).",
        "Validates admin role, executes database transaction, constructs AuditLog entity with actor email and client IP.",
        "Updated database records committed; immutable row inserted into audit_logs table.",
        "HTTP 403 Forbidden if user lacks administrative role.",
        "Acting user is authenticated with role == 'admin'.",
        "Administrative modification persisted; security audit trail recorded.",
        "Role changes recorded in audit_logs with actor email and timestamp.",
        "Pytest test_admin_auth.py"
    )

    # 4.2.2 System Architecture Diagram
    add_heading_3(doc, "4.2.2 Multi-Tier System Architecture Diagram")
    add_body_p(doc, "Figure 5 illustrates the complete multi-tier engineering topology of CampusWay, showcasing client presentation, reverse-proxy gateway routing, FastAPI service modules, the spatial routing engine, and persistent storage layers.")
    add_figure_image(doc, "system_architecture.png", "5", "Multi-Tier System Architecture Diagram — Client, Gateway, Engine, and Persistence Layers")
    add_body_p(doc, "The architecture enforces clean separation of concerns: Next.js 16 handles presentation and client-side geospatial rendering; FastAPI provides the REST API gateway with GZip compression and CORS credential handling; the spatial engine executes Dijkstra and A* algorithms in memory; and PostgreSQL (Neon Cloud) / SQLite provides relational persistence with Alembic versioning.")

    # 4.2.3 Entity-Relationship Diagram
    add_heading_3(doc, "4.2.3 Relational Database Entity-Relationship Diagram (ERD)")
    add_body_p(doc, "Figure 6 models the complete relational database schema implemented in PostgreSQL (Neon) and mirrored in development via SQLite (campusway_dev.db).")
    add_figure_image(doc, "entity_relationship_diagram.png", "6", "Relational Database Entity-Relationship Diagram (ERD) — Foreign Keys and Cardinality")
    add_body_p(doc, "The database structure comprises eight core relational entities: users (central identity store); user_credentials (1:1 Argon2id password hashes); user_sessions (1:N SHA-256 session token hashes); locations (campus POIs with WGS84 coordinates); nodes (graph waypoints); edges (walkable segments between nodes with distance in meters); location_reports (assistance tickets); and audit_logs (immutable administrative action ledger).")

    # 4.2.4 Activity Diagram
    add_heading_3(doc, "4.2.4 UML Activity Diagram (Route Generation & Rerouting)")
    add_body_p(doc, "Figure 7 illustrates the procedural control flow of the route generation pipeline, including origin evaluation, cache checking, priority queue relaxation, turn guidance generation, and dynamic off-route rerouting.")
    add_figure_image(doc, "activity_diagram.png", "7", "UML Activity Diagram — Route Generation and Real-Time Dynamic Rerouting Control Flow")
    add_body_p(doc, "The activity flow models both successful path construction and adaptive behavior: if the pedestrian drifts more than 25 meters away from the active route polyline, the system automatically snaps current coordinates to the nearest graph node and recomputes the optimal path in the background.")

    # 4.2.5 Sequence Diagram - Authentication
    add_heading_3(doc, "4.2.5 UML Sequence Diagram (Dual-Mode Authentication)")
    add_body_p(doc, "Figure 8 depicts the cryptographic sign-in pipeline supporting both web session cookies and mobile Bearer tokens with Argon2id password verification and SHA-256 hashed database sessions.")
    add_figure_image(doc, "sequence_diagram_auth.png", "8", "UML Sequence Diagram — Dual-Mode Authentication with Argon2id Verification and Session Persistence")
    add_body_p(doc, "The sequence highlights critical security guarantees: passwords are verified in constant time; active session tokens are stored in the database exclusively as cryptographic SHA-256 hashes; and web clients receive HttpOnly, SameSite=Lax cookies that cannot be accessed by client-side scripts.")

    # 4.2.6 Sequence Diagram - Routing
    add_heading_3(doc, "4.2.6 UML Sequence Diagram (Shortest-Path Route Calculation)")
    add_body_p(doc, "Figure 9 depicts an end-to-end user navigation journey from initial POI lookup through route calculation, database retrieval, caching, and client-side polyline rendering.")
    add_figure_image(doc, "sequence_diagram_routing.png", "9", "UML Sequence Diagram — Shortest-Path Route Calculation, Caching, and Bearing HUD Pipeline")
    add_body_p(doc, "The sequence models the in-memory route caching layer: repeated queries for identical origin/destination pairs resolve in <1ms from the LRU cache, bypassing database queries and graph relaxation loops.")

    # 4.2.7 State Machine Diagram
    add_heading_3(doc, "4.2.7 UML State Machine Diagram (GPS Snapping & Navigation Lifecycle)")
    add_body_p(doc, "Figure 10 depicts the finite state lifecycle of pedestrian device coordinates within campus boundaries, modeling transitions between IDLE, LOW_ACCURACY, OUT_OF_BOUNDS, UNSURVEYED_AREA, SNAPPED, NAVIGATING, and OFF_ROUTE_REROUTING states.")
    add_figure_image(doc, "state_diagram_gps.png", "10", "UML State Machine Diagram — Real-Time GPS Snapping and Spatial Boundary Lifecycle")
    add_body_p(doc, "The state machine guarantees predictable UI feedback: coordinates coarser than 50m trigger an amber warning without corrupting graph state; positions >75m from pathways trigger unsurveyed landmark orientation; and off-route drift >25m triggers seamless background rerouting.")

def build_section_5(doc):
    """Construct Section 5: GITHUB LINK AND REPOSITORY STRUCTURE."""
    add_heading_1(doc, "5. GITHUB LINK AND SOURCE CODE ARCHITECTURE")
    
    # 5.1 Repository URL
    add_heading_2(doc, "5.1 Project Repository Link")
    add_body_p(doc, "The complete source code, automated test suites, database migration scripts, and architectural assets of CampusWay are maintained under Git version control at the following public repository:")
    
    p_link = doc.add_paragraph()
    p_link.paragraph_format.space_before = Pt(4)
    p_link.paragraph_format.space_after = Pt(8)
    r_l = p_link.add_run("https://github.com/06Pseudo06/Campus-Navigation")
    r_l.bold = True
    r_l.font.name = "Times New Roman"
    r_l.font.size = Pt(12)
    r_l.font.color.rgb = COLOR_NAVY
    
    add_body_p(doc, "• Primary Development Branch: feat/admin-workspace (Head commit: b790ac7). This branch represents the complete, fully integrated production release containing the Administrative Workspace, audit logging, and operations consoles.")
    add_body_p(doc, "• Baseline Production Branch: main (Head commit: dc9762a). Contains the foundational dual-mode authentication, core routing engine, and explored views.")

    # 5.2 Repository Organization
    add_heading_2(doc, "5.2 Source Code Directory Organization")
    add_body_p(doc, "The repository is structured into modular frontend, backend, database, and documentation packages conforming to modern full-stack software engineering standards:")
    
    repo_structure = (
        "Campus-Navigation/\n"
        "├── frontend/                       # Next.js 16.4.6 App Router Presentation Tier\n"
        "│   ├── src/\n"
        "│   │   ├── app/                    # Next.js Route Groups and Viewports\n"
        "│   │   │   ├── page.tsx            # Architectural Homepage & Kinetic Hero\n"
        "│   │   │   ├── explore/page.tsx    # Explore Map Dashboard & POI Search HUD\n"
        "│   │   │   ├── navigate/page.tsx   # Direct Navigation Viewport & Turn HUD\n"
        "│   │   │   ├── login/page.tsx      # Dual-Mode Authentication Sign-In Dialog\n"
        "│   │   │   ├── profile/page.tsx    # User Profile & Session Security Center\n"
        "│   │   │   └── admin/              # Administrative Operations Workspace\n"
        "│   │   │       ├── layout.tsx      # Independent Admin Sidebar & Topbar Shell\n"
        "│   │   │       ├── page.tsx        # Overview KPI Dashboard & System Telemetry\n"
        "│   │   │       ├── users/page.tsx  # User Directory Management & Role Elevation\n"
        "│   │   │       ├── locations/      # Campus POI CRUD Repository Management\n"
        "│   │   │       ├── routes/page.tsx # Spatial Nodes/Edges & Graph Diagnostics\n"
        "│   │   │       ├── reports/        # Mobility Assistance & Map Issue Triage\n"
        "│   │   │       ├── audit-logs/     # Immutable Security Activity Audit Ledger\n"
        "│   │   │       ├── settings/       # Cache Flush Controls & System Parameters\n"
        "│   │   │       └── qr/page.tsx     # Vector Signpost Sheet Generator\n"
        "│   │   ├── components/             # Reusable React UI Components\n"
        "│   │   │   ├── admin/              # AdminGuard, Sidebar, TopBar, Metric Cards\n"
        "│   │   │   ├── dashboard/          # CampusMap (Mapbox GL), SvgCampusMap Fallback\n"
        "│   │   │   │   ├── QrScannerModal  # Html5Qrcode Camera Scanner & Torch Control\n"
        "│   │   │   │   └── MockLocation    # Developer GPS Testing Controller\n"
        "│   │   │   └── auth/               # LoginForm, GoogleButton, RegisterForm\n"
        "│   │   ├── hooks/                  # Custom React Hooks (useGeolocation, useDebounce)\n"
        "│   │   ├── lib/                    # Spatial Mathematics (gpsSnapping, qrNavigation)\n"
        "│   │   └── services/               # Client API Services (authService, routeService)\n"
        "├── backend/                        # FastAPI Python 3.13 ASGI Application Tier\n"
        "│   ├── app/\n"
        "│   │   ├── main.py                 # FastAPI Application Factory, CORS & GZip\n"
        "│   │   ├── core/                   # SecurityManager (Argon2id, JWT), Database Engine\n"
        "│   │   ├── api/\n"
        "│   │   │   ├── dependencies.py     # require_admin_role, get_current_user Guards\n"
        "│   │   │   ├── routes/             # Core API Routes (admin, locations, routing)\n"
        "│   │   │   └── v1/auth.py          # Session Cookie & JWT Authentication Router\n"
        "│   │   ├── models/                 # SQLAlchemy 2.0 Relational Entities\n"
        "│   │   │   ├── user.py             # User, UserIdentity ORM Mappings\n"
        "│   │   │   ├── user_credential.py  # UserCredential (1:1 Password Hash Entity)\n"
        "│   │   │   ├── user_session.py     # UserSession (1:N Token Hash Entity)\n"
        "│   │   │   ├── location.py         # Location POI Relational Entity\n"
        "│   │   │   ├── node.py & edge.py   # Spatial Graph Topology Entities\n"
        "│   │   │   └── audit_log.py        # AuditLog Immutable Activity Entity\n"
        "│   │   ├── schemas/                # Pydantic v2 Input/Output Validation Models\n"
        "│   │   └── services/               # Business Logic, Pathfinding (algorithms.py)\n"
        "│   │       ├── user_store.py       # ResilientUserRepository (Postgres + In-Memory)\n"
        "│   │       └── audit_service.py    # Transactional Security Audit Event Logger\n"
        "│   ├── alembic/versions/           # Database Schema Migrations (001 to 006)\n"
        "│   └── tests/                      # Pytest Automated Test Suite (109 passing tests)\n"
        "└── database/                       # Canonical Spatial Datasets & Seed Scripts\n"
        "    ├── surveys/                    # lpu_verified_survey.json (Dataset C Ground Truth)\n"
        "    └── seeds/                      # seed_surveyed_dataset_c.py Deterministic Seeder\n"
    )
    
    p_code = doc.add_paragraph()
    p_code.paragraph_format.space_before = Pt(6)
    p_code.paragraph_format.space_after = Pt(12)
    r_c = p_code.add_run(repo_structure)
    r_c.font.name = "Consolas"
    r_c.font.size = Pt(8.5)
    r_c.font.color.rgb = COLOR_NAVY

def main():
    print("=" * 70)
    print("CAMPUSWAY IEEE-STYLE SOFTWARE REQUIREMENTS SPECIFICATION BUILDER")
    print("=" * 70)
    
    doc = Document()
    
    # Configure A4 Page Layout
    section = doc.sections[0]
    section.page_width = Inches(8.27)   # A4 Width
    section.page_height = Inches(11.69) # A4 Height
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)
    
    # Header & Footer configuration
    header = section.header
    p_hdr = header.paragraphs[0]
    p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_hdr = p_hdr.add_run("CampusWay: Software Requirements Specification (SRS) | LPU CA3")
    r_hdr.font.name = "Times New Roman"
    r_hdr.font.size = Pt(8.5)
    r_hdr.font.color.rgb = COLOR_MUTED
    
    footer = section.footer
    p_ftr = footer.paragraphs[0]
    p_ftr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ftr = p_ftr.add_run("Lovely Professional University — Department of Computer Science & Engineering")
    r_ftr.font.name = "Times New Roman"
    r_ftr.font.size = Pt(8.5)
    r_ftr.font.color.rgb = COLOR_MUTED
    
    print("1/5: Building Title Page...")
    build_title_page(doc)
    
    print("2/5: Building Preliminary Pages (Control, TOC, Lists, Abbreviations)...")
    build_preliminary_pages(doc)
    
    print("3/5: Building Section 1 (Introduction)...")
    build_section_1(doc)
    
    print("4/5: Building Section 2 (General Description)...")
    build_section_2(doc)
    
    print("5/5: Building Section 3 (Specific Requirements & FR-001 to FR-015)...")
    build_section_3(doc)
    
    print("6/6: Building Section 4 (Analysis Models & Diagrams) & Section 5 (GitHub)...")
    build_section_4(doc)
    build_section_5(doc)
    
    print(f"Saving refined edition to: {OUTPUT_PATH_REFINED}")
    doc.save(OUTPUT_PATH_REFINED)
    print(f"SUCCESS: Document saved to {OUTPUT_PATH_REFINED} ({os.path.getsize(OUTPUT_PATH_REFINED):,} bytes).")
    
    try:
        print(f"Saving compiled document to: {OUTPUT_PATH}")
        doc.save(OUTPUT_PATH)
        print(f"SUCCESS: Document saved to {OUTPUT_PATH} ({os.path.getsize(OUTPUT_PATH):,} bytes).")
    except PermissionError:
        print(f"NOTE: {OUTPUT_PATH} is currently open in Microsoft Word. Saved to {OUTPUT_PATH_REFINED} instead.")
        
    # Copy to artifacts directory
    artifact_dir = r"C:\Users\KK\.gemini\antigravity\brain\fb7f0586-9047-471d-9f4b-f0c1235789b6"
    if os.path.exists(artifact_dir):
        import shutil
        art_refined_path = os.path.join(artifact_dir, "CampusWay_IEEE_SRS_Report_Refined.docx")
        shutil.copy2(OUTPUT_PATH_REFINED, art_refined_path)
        try:
            art_path = os.path.join(artifact_dir, "CampusWay_IEEE_SRS_Report.docx")
            shutil.copy2(OUTPUT_PATH_REFINED, art_path)
        except Exception:
            pass
        print(f"SUCCESS: Copied refined report to artifacts directory.")
    print("=" * 70)

if __name__ == "__main__":
    main()
