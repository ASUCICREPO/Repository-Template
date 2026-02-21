# User Guide

This guide provides step-by-step instructions for using the CincyMuse Chatbot.

---

## Prerequisites

**Please ensure the application is deployed before proceeding.** 

See the [Deployment Guide](./deploymentGuide.md) for deployment instructions.

---

## Introduction

The CincyMuse Chatbot is an AI-powered conversational assistant designed to help visitors of the Cincinnati Museum Center find information quickly and easily. Whether you're planning a visit, looking for exhibit details, or want to learn about membership options, CincyMuse is here to help in both English and Spanish.

### Key Features
- **Bilingual support**: Chat in English or Spanish
- **Instant answers**: Get information about exhibits, events, tickets, and memberships
- **Source citations**: See where information comes from (website, collections, podcasts)
- **Streaming responses**: Watch answers appear in real-time
- **Feedback system**: Help improve responses with thumbs up/down ratings

---

## Getting Started

### Step 1: Access the Application

Navigate to the CincyMuse chatbot URL provided by your administrator (typically hosted on AWS Amplify).

Example: `https://main.d1a2b3c4d5e6f7.amplifyapp.com`

![Step 1 - Application Landing Page](./media/step-1-landing-page.png)

> **[PLACEHOLDER]** Please provide a screenshot of the application landing page showing the chat interface and save as `docs/media/step-1-landing-page.png`

- You'll see a clean chat interface with the CincyMuse logo
- The chat input box is at the bottom of the screen
- A language selector (English/Español) is visible in the top-right corner

---

### Step 2: Select Your Language

Click the language dropdown in the top-right corner and choose your preferred language:
- **English** - For English responses
- **Español** - For Spanish responses

![Step 2 - Language Selection](./media/step-2-language.png)

> **[PLACEHOLDER]** Please provide a screenshot showing the language selector dropdown and save as `docs/media/step-2-language.png`

- The chatbot will remember your language choice for the entire conversation
- You can switch languages at any time during your chat
- All responses will be in your selected language

---

### Step 3: Ask a Question

Type your question in the chat input box at the bottom of the screen and press Enter or click the Send button.

**Example questions**:
- "What are the museum hours?"
- "How much are tickets?"
- "What exhibits are currently showing?"
- "Tell me about membership options"

![Step 3 - Ask Question](./media/step-3-question.png)

> **[PLACEHOLDER]** Please provide a screenshot showing a user typing a question in the input box and save as `docs/media/step-3-question.png`

- Questions can be up to 1,000 characters
- Use natural language - no special formatting needed
- Be specific for better results (e.g., "What time does the museum open on Saturdays?" vs "hours")

---

### Step 4: View the Streaming Response

Watch as CincyMuse generates your answer in real-time. The response will appear word-by-word in a chat bubble.

![Step 4 - Streaming Response](./media/step-4-response.png)

> **[PLACEHOLDER]** Please provide a screenshot showing a response being generated with the streaming effect and save as `docs/media/step-4-response.png`

- Responses typically take 2-5 seconds to complete
- The chatbot uses AI to understand your question and search museum content
- If the chatbot doesn't have enough information, it will provide a phone number to contact the museum directly

---

### Step 5: Review Sources and Provide Feedback

After the response is complete, you'll see:
1. **Source citations** - Links to where the information came from (website, collections, podcasts)
2. **Feedback buttons** - Thumbs up 👍 or thumbs down 👎 to rate the response

![Step 5 - Sources and Feedback](./media/step-5-sources-feedback.png)

> **[PLACEHOLDER]** Please provide a screenshot showing the complete response with source citations and feedback buttons and save as `docs/media/step-5-sources-feedback.png`

- Click source links to verify information or learn more
- Your feedback helps improve the chatbot's responses
- Feedback is anonymous and used for analytics only

---

## Common Use Cases

### Use Case 1: Planning Your Visit

**Scenario**: You want to know the museum hours, ticket prices, and parking information before visiting.

**Steps**:
1. Ask: "What are the museum hours?"
2. Review the response with operating hours
3. Follow up: "How much are tickets?"
4. Ask: "Is there parking available?"

**Example conversation**:
- **You**: "What time does the museum open on weekends?"
- **CincyMuse**: "The Cincinnati Museum Center is open on Saturdays and Sundays from 10:00 AM to 5:00 PM. We recommend arriving early to make the most of your visit!"
- **You**: "How much are adult tickets?"
- **CincyMuse**: "Adult admission is $18.50 for general admission. This includes access to all museums and special exhibits. Members get free admission!"

![Use Case 1 Example](./media/use-case-1-visit-planning.png)

> **[PLACEHOLDER]** Please provide a screenshot demonstrating a conversation about planning a visit

---

### Use Case 2: Learning About Exhibits

**Scenario**: You want to discover what exhibits are currently on display and learn about specific collections.

**Steps**:
1. Ask: "What exhibits are currently showing?"
2. Choose an exhibit that interests you
3. Ask follow-up questions: "Tell me more about [exhibit name]"
4. Ask: "Are there any special events related to this exhibit?"

**Example conversation**:
- **You**: "What exhibits are currently showing?"
- **CincyMuse**: "We currently have several exciting exhibits including the Cincinnati History Museum, Museum of Natural History & Science, Duke Energy Children's Museum, and special traveling exhibits. Would you like to know more about any specific exhibit?"
- **You**: "Tell me about the Natural History Museum"
- **CincyMuse**: "The Museum of Natural History & Science features fascinating exhibits including the Ice Age gallery with life-size models of prehistoric creatures, the Cavern with real limestone formations, and interactive science demonstrations. It's perfect for all ages!"

![Use Case 2 Example](./media/use-case-2-exhibits.png)

> **[PLACEHOLDER]** Please provide a screenshot demonstrating a conversation about exhibits

---

### Use Case 3: Membership and Support

**Scenario**: You're interested in becoming a member or supporting the museum.

**Steps**:
1. Ask: "What are the membership benefits?"
2. Ask: "How much does membership cost?"
3. Ask: "How can I support the museum?"
4. Click source links to visit the membership page

**Example conversation**:
- **You**: "What are the benefits of becoming a member?"
- **CincyMuse**: "Museum members enjoy free unlimited admission, discounts on programs and events, exclusive member previews, reciprocal admission to 300+ museums nationwide, and the satisfaction of supporting our mission. It's a great value for frequent visitors!"
- **You**: "How much is a family membership?"
- **CincyMuse**: "Family memberships start at $125 per year and include admission for 2 adults and up to 4 children. You can visit as often as you like!"

![Use Case 3 Example](./media/use-case-3-membership.png)

> **[PLACEHOLDER]** Please provide a screenshot demonstrating a conversation about membership

---

### Use Case 4: Finding Specific Information

**Scenario**: You need quick answers to specific questions about accessibility, dining, or special programs.

**Steps**:
1. Ask specific questions directly
2. Use follow-up questions to get more details
3. Click source citations to verify information

**Example questions**:
- "Is the museum wheelchair accessible?"
- "Are there restaurants or cafes in the museum?"
- "Do you offer school group tours?"
- "What COVID-19 safety measures are in place?"
- "Can I host a birthday party at the museum?"

![Use Case 4 Example](./media/use-case-4-specific-info.png)

> **[PLACEHOLDER]** Please provide a screenshot demonstrating specific information queries

---

## Tips and Best Practices

- **Tip 1: Be specific** - Instead of "tickets", ask "How much are adult tickets for Saturday?"
- **Tip 2: Use natural language** - Ask questions as you would to a person: "What time do you close?" works great
- **Tip 3: Check source citations** - Click the source links to verify information or learn more details
- **Tip 4: Provide feedback** - Use thumbs up/down to help improve responses for future visitors
- **Tip 5: Ask follow-up questions** - The chatbot remembers your conversation, so you can ask related questions
- **Tip 6: Switch languages anytime** - Change between English and Spanish at any point in your conversation
- **Tip 7: Start a new conversation** - Refresh the page to start fresh if you want to change topics completely

---

## Frequently Asked Questions (FAQ)

### Q: What topics can CincyMuse help me with?
**A:** CincyMuse can answer questions about:
- Museum hours and admission prices
- Current and upcoming exhibits
- Special events and programs
- Membership benefits and pricing
- Museum collections and artifacts
- Parking and accessibility
- Group tours and educational programs
- Support and donation opportunities
- Museum history and podcasts

### Q: How accurate are the responses?
**A:** CincyMuse uses AI to search official museum content including the website, collections database, and podcasts. Each response includes source citations so you can verify information. If the chatbot isn't confident about an answer, it will provide a phone number to contact the museum directly.

### Q: Can I use CincyMuse in Spanish?
**A:** Yes! Click the language selector in the top-right corner and choose "Español". All responses will be in Spanish. You can switch back to English at any time.

### Q: Is my conversation private?
**A:** Conversations are logged anonymously for analytics and improvement purposes. Personal information (PII) is automatically redacted from logs. Your feedback (thumbs up/down) is also anonymous.

### Q: What if CincyMuse doesn't know the answer?
**A:** If the chatbot doesn't have enough information to answer confidently, it will let you know and provide the museum's phone number: (513) 287-7000. You can also check the source citations to find more detailed information on the museum website.

### Q: Can I ask multiple questions in one message?
**A:** Yes, but you'll get better results by asking one question at a time. This allows the chatbot to focus on each topic and provide more detailed answers.

### Q: How do I start a new conversation?
**A:** Simply refresh the page to start a new conversation. Your previous conversation will not be saved in your browser.

---

## Troubleshooting

### Issue: The chatbot is not responding
**Solution:** 
- Check your internet connection
- Refresh the page and try again
- If the problem persists, the service may be temporarily unavailable - try again in a few minutes
- Contact the museum at (513) 287-7000 for immediate assistance

### Issue: Responses are in the wrong language
**Solution:** 
- Check the language selector in the top-right corner
- Click it and select your preferred language (English or Español)
- The next response will be in the selected language

### Issue: The response doesn't answer my question
**Solution:** 
- Try rephrasing your question with more specific details
- Break complex questions into smaller, focused questions
- Check the source citations - the detailed information may be in the linked pages
- Provide thumbs down feedback to help improve future responses
- For urgent or complex questions, call the museum at (513) 287-7000

### Issue: Source links are not working
**Solution:** 
- Ensure you have a stable internet connection
- Try opening the link in a new tab
- Some sources may be from internal collections databases that require direct museum access
- Contact the museum for assistance accessing specific resources

### Issue: The page is loading slowly
**Solution:** 
- Check your internet connection speed
- Close other browser tabs to free up resources
- Try using a different browser (Chrome, Firefox, Safari, Edge)
- Clear your browser cache and cookies
- If using mobile, ensure you have a strong Wi-Fi or cellular signal

---

## Getting Help

If you encounter issues not covered in this guide:

- **Call the museum**: (513) 287-7000 during business hours
- **Visit the website**: [https://www.cincymuseum.org](https://www.cincymuseum.org)
- **Email support**: Contact the museum through their website contact form
- **Technical issues**: Report bugs or technical problems to the development team through the project repository

---

## Next Steps

- Explore the [API Documentation](./APIDoc.md) if you're interested in integrating with the chatbot programmatically
- Check the [Architecture Deep Dive](./architectureDeepDive.md) to understand how the system works
- See the [Modification Guide](./modificationGuide.md) if you want to customize or extend the chatbot
- Review the [Deployment Guide](./deploymentGuide.md) for information about hosting your own instance

---

## Feedback and Improvement

Your feedback helps make CincyMuse better! Please use the thumbs up/down buttons after each response to rate the quality and accuracy. This anonymous feedback is used to:

- Improve response accuracy
- Identify common questions for better content coverage
- Optimize the AI model's performance
- Guide future feature development

Thank you for using CincyMuse! We hope it enhances your museum experience.

