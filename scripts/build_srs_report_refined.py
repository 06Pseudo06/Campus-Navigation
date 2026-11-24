"""
CampusWay IEEE-Style Software Requirements Specification (SRS) Report Builder (Refined Edition).
Transforms feature tables into high-readability structured narrative paragraphs, numbered workflows,
and bullet points while retaining essential comparative tables, diagrams, and IEEE preliminary structures.

Output:
- CampusWay_IEEE_SRS_Report_Refined.docx
- CampusWay_IEEE_SRS_Report.docx (updated)
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
OUTPUT_PATH_REFINED = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "CampusWay_IEEE_SRS_Report_Refined.docx"))
OUTPUT_PATH_MAIN = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "CampusWay_IEEE_SRS_Report.docx"))

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
    """Apply internal padding (dxa) to a table cell."""
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
    """Format table header row with deep navy fill and white bold text."""
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
    """Format table body rows with alternating shading and clean typography."""
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
    """Add Sub-subsection Heading (e.g. 3.2.1 FR-001: User Account Registration)."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.color.rgb = COLOR_ACCENT
    return p

def add_heading_4(doc, text):
    """Add Sub-aspect Heading (e.g. Inputs & Parameters)."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(10.5)
    run.font.bold = True
    run.font.color.rgb = COLOR_NAVY
    return p

def add_body_p(doc, text, bold_prefix="", italic=False):
    """Add standard justified body paragraph with 1.15 line spacing."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(5)
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

def add_bullet_item(doc, bold_prefix, text, level=0):
    """Add a structured bullet item with clean hanging indent."""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.15
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    
    r_bullet = p.add_run("•  ")
    r_bullet.bold = True
    r_bullet.font.name = "Times New Roman"
    r_bullet.font.size = Pt(10.5)
    r_bullet.font.color.rgb = COLOR_ACCENT
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.name = "Times New Roman"
        r_pre.font.size = Pt(10.5)
        r_pre.font.color.rgb = COLOR_NAVY
        
    r_text = p.add_run(text)
    r_text.font.name = "Times New Roman"
    r_text.font.size = Pt(10.5)
    r_text.font.color.rgb = COLOR_DARK
    return p

def add_numbered_item(doc, num_str, bold_prefix, text, level=0):
    """Add a structured numbered list step with clean hanging indent."""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25 * (level + 1))
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.15
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    
    r_num = p.add_run(f"{num_str}.  ")
    r_num.bold = True
    r_num.font.name = "Times New Roman"
    r_num.font.size = Pt(10.5)
    r_num.font.color.rgb = COLOR_NAVY
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.bold = True
        r_pre.font.name = "Times New Roman"
        r_pre.font.size = Pt(10.5)
        r_pre.font.color.rgb = COLOR_NAVY
        
    r_text = p.add_run(text)
    r_text.font.name = "Times New Roman"
    r_text.font.size = Pt(10.5)
    r_text.font.color.rgb = COLOR_DARK
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

def add_feature_narrative(
    doc,
    sec_num,
    req_id,
    title,
    priority,
    intro_paragraphs,
    inputs,
    processing_steps,
    outputs,
    exception_flows,
    preconditions,
    postconditions,
    acceptance_criteria,
    verification_method="Automated Pytest & Integration Demonstration"
):
    """Construct a comprehensive, highly readable feature requirement specification in structured prose."""
    add_heading_3(doc, f"{sec_num} {req_id}: {title}")
    
    # Priority & Verification header
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(4)
    r_p = p_meta.add_run("Requirement Priority: ")
    r_p.bold = True
    r_p.font.name = "Times New Roman"
    r_p.font.size = Pt(9.5)
    r_p.font.color.rgb = COLOR_NAVY
    
    r_pv = p_meta.add_run(f"{priority}  |  ")
    r_pv.font.name = "Times New Roman"
    r_pv.font.size = Pt(9.5)
    r_pv.font.color.rgb = COLOR_ACCENT
    r_pv.bold = True
    
    r_v = p_meta.add_run("Verification Method: ")
    r_v.bold = True
    r_v.font.name = "Times New Roman"
    r_v.font.size = Pt(9.5)
    r_v.font.color.rgb = COLOR_NAVY
    
    r_vv = p_meta.add_run(verification_method)
    r_vv.font.name = "Times New Roman"
    r_vv.font.size = Pt(9.5)
    r_vv.font.color.rgb = COLOR_DARK
    
    # Explanatory introduction paragraphs
    for p_text in intro_paragraphs:
        add_body_p(doc, p_text)
        
    # Inputs & Parameters
    add_heading_4(doc, "Inputs & Data Parameters:")
    for inp_label, inp_desc in inputs:
        add_bullet_item(doc, f"{inp_label}: ", inp_desc)
        
    # Processing Steps (Numbered Workflow)
    add_heading_4(doc, "Processing Logic & Sequential Execution:")
    for step_num, (step_label, step_desc) in enumerate(processing_steps, start=1):
        add_numbered_item(doc, str(step_num), f"{step_label}: ", step_desc)
        
    # Expected Outputs & System State
    add_heading_4(doc, "Expected Outputs & System State:")
    for out_item in outputs:
        add_bullet_item(doc, "", out_item)
        
    # Exception Handling & Error Responses
    add_heading_4(doc, "Exception Handling & Error Flows:")
    for err_code, err_desc in exception_flows:
        add_bullet_item(doc, f"{err_code}: ", err_desc)
        
    # Preconditions & Postconditions
    add_heading_4(doc, "Preconditions & Postconditions:")
    add_bullet_item(doc, "Preconditions: ", preconditions)
    add_bullet_item(doc, "Postconditions: ", postconditions)
    
    # Acceptance Criteria
    add_heading_4(doc, "Acceptance Criteria:")
    for crit in acceptance_criteria:
        add_bullet_item(doc, "Verification: ", crit)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(8)

def add_use_case_narrative(
    doc,
    uc_num,
    uc_id,
    title,
    actor,
    priority,
    description,
    preconditions,
    main_flow_steps,
    alternative_flows,
    postconditions,
    special_requirements
):
    """Construct a clean, readable Use Case Description in structured academic prose."""
    add_heading_3(doc, f"{uc_num} {uc_id}: {title}")
    
    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(4)
    r_a = p_meta.add_run("Primary Actor: ")
    r_a.bold = True
    r_a.font.name = "Times New Roman"
    r_a.font.size = Pt(9.5)
    r_a.font.color.rgb = COLOR_NAVY
    
    r_av = p_meta.add_run(f"{actor}  |  ")
    r_av.font.name = "Times New Roman"
    r_av.font.size = Pt(9.5)
    r_av.font.color.rgb = COLOR_DARK
    
    r_p = p_meta.add_run("Priority: ")
    r_p.bold = True
    r_p.font.name = "Times New Roman"
    r_p.font.size = Pt(9.5)
    r_p.font.color.rgb = COLOR_NAVY
    
    r_pv = p_meta.add_run(priority)
    r_pv.font.name = "Times New Roman"
    r_pv.font.size = Pt(9.5)
    r_pv.font.color.rgb = COLOR_ACCENT
    r_pv.bold = True
    
    add_body_p(doc, description)
    
    add_heading_4(doc, "Use Case Preconditions:")
    add_bullet_item(doc, "", preconditions)
    
    add_heading_4(doc, "Main Success Scenario (Normal Workflow):")
    for step_num, step_text in enumerate(main_flow_steps, start=1):
        add_numbered_item(doc, str(step_num), "", step_text)
        
    add_heading_4(doc, "Extensions & Alternative Flows:")
    for alt_label, alt_desc in alternative_flows:
        add_bullet_item(doc, f"{alt_label}: ", alt_desc)
        
    add_heading_4(doc, "Postconditions:")
    add_bullet_item(doc, "", postconditions)
    
    add_heading_4(doc, "Special Non-Functional Considerations:")
    add_bullet_item(doc, "", special_requirements)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

print("Refined builder functions initialized.")
