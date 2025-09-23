# Claude Commands & Checkpoint System

This directory contains templates and checkpoints for managing development sessions with Claude Code. Use these to maintain context between sessions and ensure smooth handoffs.

---

## 📁 **Directory Structure**

```
.claude/
└── commands/
    ├── README.md                 ← You are here
    ├── checkpoint-template.md    ← Reusable template for creating checkpoints
    ├── current-checkpoint.md     ← Latest project state and handoff info
    └── [date]-checkpoint.md      ← Historical checkpoints (create as needed)
```

---

## 🚀 **Quick Start Guide**

### **For Current Session (Starting Work):**
1. **Read** `current-checkpoint.md` to understand project state
2. **Review** next priority tasks and known issues
3. **Check** environment setup requirements
4. **Start** working on high-priority items

### **For Session End (Handing Off):**
1. **Update** `current-checkpoint.md` with recent progress
2. **Add** any new issues or blockers discovered
3. **Update** next priority tasks based on new state
4. **Create** dated checkpoint if major milestone reached

---

## 📋 **Using the Checkpoint Template**

### **Creating a New Checkpoint:**
```bash
# Copy template to new dated checkpoint
cp .claude/commands/checkpoint-template.md .claude/commands/2025-01-23-checkpoint.md

# Edit the new file with current project state
# Then update current-checkpoint.md to point to latest state
```

### **Template Sections Explained:**

#### **📋 Project Status**
- Overall progress rating (1-5 stars)
- Major milestone checkboxes
- Quick health check of project

#### **🚀 Recently Completed**
- What was accomplished this session
- Major features, improvements, and bug fixes
- Helps track velocity and progress

#### **🎯 Next Priority Tasks**
- **High Priority:** Critical items that must be done next
- **Medium Priority:** Important but not urgent
- **Low Priority:** Future enhancements

#### **🏗️ Architecture Overview**
- Current tech stack and its status
- Key system components and their health
- Integration points and dependencies

#### **🔧 Technical Implementation**
- Database schema and migrations
- API endpoints and their status
- Feature system implementations

#### **🐛 Known Issues & Blockers**
- Critical issues that prevent progress
- Minor issues that need eventual attention
- Technical debt items

#### **📁 Important Files & Locations**
- Key configuration and setup files
- Core application components
- Recent changes and modifications

#### **💡 Context & Decisions**
- Important architectural decisions made
- Rationale behind implementation choices
- Security considerations and measures

#### **🚨 Critical Information**
- Environment setup requirements
- Testing status and coverage
- Deployment considerations

---

## 🎯 **Best Practices**

### **When to Create Checkpoints:**

#### **✅ Always Create Checkpoints For:**
- Major feature completions
- Architectural changes
- Security updates
- Database schema changes
- Before long breaks in development

#### **📝 Update Current Checkpoint For:**
- Daily progress updates
- Bug fixes
- Minor feature additions
- Configuration changes

### **Writing Effective Checkpoints:**

#### **Be Specific:**
- ❌ "Fixed database issue"
- ✅ "Fixed GIST index UUID constraint error in featured_listings table"

#### **Include Context:**
- Why decisions were made
- What alternatives were considered
- How to reproduce issues

#### **Prioritize Clearly:**
- Use High/Medium/Low priority levels
- Explain why something is high priority
- Include time estimates if possible

#### **Document Blockers:**
- What's preventing progress
- What information is needed
- Who can help resolve issues

---

## 🔧 **Checkpoint Management Commands**

### **Create New Checkpoint:**
```bash
# Copy template
cp .claude/commands/checkpoint-template.md .claude/commands/$(date +%Y-%m-%d)-checkpoint.md

# Edit with current state
nano .claude/commands/$(date +%Y-%m-%d)-checkpoint.md
```

### **Update Current Checkpoint:**
```bash
# Edit current state
nano .claude/commands/current-checkpoint.md
```

### **List All Checkpoints:**
```bash
# See all checkpoint files
ls -la .claude/commands/*checkpoint*.md
```

### **Compare Checkpoints:**
```bash
# See what changed between checkpoints
diff .claude/commands/2025-01-20-checkpoint.md .claude/commands/2025-01-23-checkpoint.md
```

---

## 📊 **Checkpoint Quality Checklist**

Before finalizing a checkpoint, ensure it includes:

### **✅ Required Information:**
- [ ] Current date and session focus
- [ ] Overall progress rating
- [ ] Recently completed tasks
- [ ] Next priority tasks (with urgency levels)
- [ ] Known issues and blockers
- [ ] Critical files and recent changes

### **✅ Technical Details:**
- [ ] Database migration status
- [ ] API endpoint status
- [ ] Environment setup requirements
- [ ] Testing status

### **✅ Context & Decisions:**
- [ ] Why certain approaches were chosen
- [ ] What challenges were encountered
- [ ] What was learned or discovered

### **✅ Handoff Information:**
- [ ] What the next session should focus on
- [ ] Any urgent items requiring immediate attention
- [ ] External dependencies or blockers

---

## 🚨 **Emergency Checkpoint Protocol**

If you need to create a quick checkpoint due to unexpected interruption:

### **Minimal Checkpoint Requirements:**
1. **What was being worked on** - Current task and progress
2. **Current issue/blocker** - What's preventing progress
3. **Quick solution** - How to resume or what to try next
4. **Critical files changed** - What was modified this session

### **Emergency Template:**
```markdown
# Emergency Checkpoint - [DATE]

**Current Task:** [What you were working on]
**Progress:** [How far you got]
**Issue:** [What problem you encountered]
**Next Step:** [What to try next]
**Files Changed:** [List key files modified]
**Environment State:** [Any special setup required]
```

---

## 🔗 **Integration with Development Workflow**

### **Git Integration:**
- Checkpoints are tracked in version control
- Include checkpoint updates in commit messages
- Reference checkpoint sections in pull requests

### **Issue Tracking:**
- Link checkpoint items to GitHub issues
- Use checkpoint priorities to triage issues
- Reference checkpoints in issue descriptions

### **Documentation:**
- Checkpoints complement code documentation
- Include architectural decisions in checkpoints
- Use checkpoints to maintain README files

---

## 🎓 **Training Claude on Checkpoints**

When starting a new session with Claude, provide this context:

```
Please read the current checkpoint at .claude/commands/current-checkpoint.md 
to understand the project state. Focus on the high-priority tasks and 
be aware of the known issues listed. Update the checkpoint when you 
complete significant work or discover new issues.
```

---

## 📈 **Checkpoint Evolution**

As the project grows, consider:

### **Advanced Checkpoints:**
- Performance metrics and benchmarks
- User feedback and feature requests
- Deployment and monitoring status
- Team member assignments and responsibilities

### **Automation Opportunities:**
- Automatic checkpoint generation from commit history
- Integration with CI/CD pipeline status
- Automated testing results in checkpoints

---

## 💡 **Tips for Success**

1. **Update Often:** Better to have frequent small updates than rare large ones
2. **Be Honest:** Include failures and false starts, not just successes
3. **Think Forward:** Always consider what the next session will need
4. **Stay Organized:** Use consistent formatting and section organization
5. **Include Context:** Assume the reader knows nothing about recent decisions

---

*This checkpoint system was created for Portal Home Hub development.*  
*Last updated: 2025-01-23*