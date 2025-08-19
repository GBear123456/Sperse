export const prompts = [
  {
    category: "Most Used Email Prompts",
    prompts: [
      {
        title: "Write a friendly follow-up email",
        subtext: "Send a follow-up after a call or meeting. Include a thank-you, recap, and next steps.",
        prompt: `Please write an email using a friendly, professional tone based on the following details:

• Recipient Info:
Name: Adam Smith
Company: Samsung International LLC

• Purpose of the email:
Following up on a recent product demo to answer any remaining questions and explore next steps for moving forward with a potential partnership.

• Prior context:
We had a 30-minute Zoom call last week where we walked through the core features of our platform.

• Tone:
Polite, warm, and supportive. Show that you're helpful and not pushy. Keep it conversational and professional.

• Styling Preferences:
Keep the message brief (under 250 words), easy to scan, and friendly. Avoid using jargon. End with a clear call to action or offer to assist further.

The email must include:
1. A thank-you for the recent meeting
2. A quick recap of key benefits discussed
3. A question about any updates from his team
4. A gentle offer to schedule a follow-up call`
      },
      {
        title: "Reply to an interested customer",
        subtext: "Respond to a customer inquiry with helpful, concise information and a warm tone.",
        id: "Reply to an interested customer",
        prompt: `Write a helpful and concise response to a customer who recently inquired about our product.

• Recipient Info:
Name: Adam Smith
Company: Samsung International LLC

• Purpose of the email:
Answer Adam’s questions about feature availability and next steps.

• Tone:
Professional, friendly, and reassuring.

• Styling Preferences:
Short paragraphs, clear answers, and direct links or CTA for further info.

The email must include:
1. Thank her for her interest
2. Address each question briefly
3. Link to product page or brochure
4. Offer to hop on a quick call`
      },
      {
        title: "Write a professional cold outreach email",
        subtext: "Introduce yourself or your product to a new lead. Keep it short, valuable, and curious.",
        id: "Write a professional cold outreach email",
        prompt: `Write a cold outreach email in a friendly but professional tone.

• Recipient Info:
Name: Adam Smith
Company: Samsung International LLC

• Purpose of the email:
To introduce our platform and highlight how it can help streamline her team’s workflow.

• Tone:
Confident, brief, curious, and respectful.

• Styling Preferences:
Max 150 words. One clear benefit, one call-to-action.

The email must include:
1. Introduction of yourself and company
2. Highlight one benefit based on their industry
3. Soft CTA to schedule a call or get a demo`
      },
      {
        title: "Write a thank-you email after purchase or signup",
        subtext: "Send a friendly thank-you and offer support, resources, or next steps.",
        id: "Write a thank-you email after purchase or signup",
        prompt: `Write a thank-you email to a new customer in a warm and welcoming tone.

• Recipient Info:
Name: Adam Smith
Company: Samsung International LLC

• Purpose of the email:
Thank Sarah for signing up and point her to key resources.

• Tone:
Grateful, supportive, and onboarding-focused.

• Styling Preferences:
Short and actionable. Include 2–3 links or buttons.

The email must include:
1. A sincere thank-you for joining
2. Getting started resources
3. Link to support or community
4. Optional referral or invite bonus`
      },
      {
        title: "Respond to a complaint or negative feedback",
        subtext: "Apologize sincerely, clarify the issue, and offer a resolution.",
        id: "Respond to a complaint or negative feedback",
        prompt: `Write a sincere and professional email responding to a customer complaint.

• Recipient Info:
Name: Adam Smith
Company: Samsung International LLC

• Purpose of the email:
Apologize and offer a resolution to a reported service issue.

• Tone:
Empathetic, clear, and solution-oriented.

• Styling Preferences:
Brief but detailed. Avoid defensive language.

The email must include:
1. Acknowledge their concern and apologize
2. Explain what went wrong (if known)
3. Offer a fix or next steps
4. Invite follow-up or feedback`
      },
      {
        title: "Send a proposal or pricing information",
        subtext: "Share pricing, packages, or custom offers after a discovery call or email.",
        id: "Send a proposal or pricing information",
        prompt: `Write a pricing proposal email following an earlier conversation.

• Recipient Info:
Name: Adam Smith
Company: Samsung International LLC

• Purpose of the email:
Provide pricing and offer support for their decision process.

• Tone:
Clear, confident, and helpful.

• Styling Preferences:
Use bullets or a short table for pricing. Close with an invite for a call.

The email must include:
1. Thank them for their interest
2. Present pricing clearly
3. Offer explanation or PDF attachment
4. Invite questions or call to discuss`
      },
      {
        title: "Follow up after no response",
        subtext: "Politely check in on an unanswered email while keeping the tone friendly and non-pushy.",
        id: "Follow up after no response",
        prompt: `Write a gentle follow-up to check in on an earlier email.

• Recipient Info:
Name: Adam Smith
Company: Samsung International LLC

• Purpose of the email:
To check whether they had a chance to review our proposal.

• Tone:
Casual, polite, and low-pressure.

• Styling Preferences:
3–4 sentences max. Add value or link.

The email must include:
1. Mention previous email or meeting
2. Restate value or key point
3. Invite response or suggest quick call`
      },
      {
        title: "Confirm an appointment or meeting",
        subtext: "Summarize time, date, and purpose of the meeting with a clear confirmation message.",
        id: "Confirm an appointment or meeting",
        prompt: `Write a meeting confirmation email.

• Recipient Info:
Name: Adam Smith
Company: Samsung International LLC

• Purpose of the email:
To confirm an upcoming Zoom meeting.

• Tone:
Professional, brief, and courteous.

• Styling Preferences:
Use bold or bullets to clarify details.

The email must include:
1. Confirm meeting time, date, and platform
2. Reaffirm purpose of the meeting
3. Add calendar link or meeting agenda (optional)`
      }
    ]
  },
  {
    category: "Sales & Promotions",
    prompts: [
      {
        title: "Announce a new product or feature",
        subtext: "Let customers know about a recent launch with key benefits and a call to action.",
        id: "Announce a new product or feature",
        prompt: `Write an announcement email for a newly launched product or feature.

Recipient Info:
To: Existing customers or newsletter subscribers

• Purpose of the email:
To introduce a newly released feature or product and explain its benefit.

• Tone:
Excited, professional, and benefit-focused.

• Styling Preferences:
Clear subject line, short intro, bullet benefits, and a CTA button.

The email must include:
1. Brief intro of the new product/feature
2. Top 2–3 benefits or use cases
3. Link to learn more, sign up, or try now
4. Optional image or testimonial`
      },
      {
        title: "Send a time-limited offer or discount",
        subtext: "Promote a sale or discount and create urgency with a strong headline and CTA.",
        id: "Send a time-limited offer or discount",
        prompt: `Write a promotional email announcing a limited-time discount.

Recipient Info:
To: Customers or prospects

• Purpose of the email:
To boost conversions or re-engage users through urgency and incentives.

• Tone:
Energetic, friendly, and action-oriented.

• Styling Preferences:
Include bold offer text, countdown/timer reference, and clear CTA.

The email must include:
1. What the offer is and how long it lasts
2. What products/services it applies to
3. How to redeem it (coupon code, link, etc.)
4. Call to action with a sense of urgency`
      },
      {
        title: "Holiday promo: Christmas message + offer",
        subtext: "Share warm wishes and a holiday promotion tailored for Christmas.",
        id: "Holiday promo: Christmas message + offer",
        prompt: `Write a holiday email for Christmas including a friendly message and special offer.

Recipient Info:
To: Customers, partners, or subscribers

• Purpose of the email:
Celebrate the holidays while sharing a festive offer.

• Tone:
Warm, joyful, and generous.

• Styling Preferences:
Holiday imagery or theme, short heartfelt message, promo clearly highlighted.

The email must include:
1. A cheerful Merry Christmas or holiday greeting
2. A brief thank-you for their support
3. A Christmas-exclusive deal or promo
4. A call to enjoy or redeem before a deadline`
      },
      {
        title: "Holiday promo: New Year motivation + discount",
        subtext: "Inspire your customers to start fresh with a new-year-themed message and offer.",
        id: "Holiday promo: New Year motivation + discount",
        prompt: `Write a motivational New Year email with a limited-time promotion.

Recipient Info:
To: Customers or prospects

• Purpose of the email:
Inspire customers to take action in the new year with a supportive message and incentive.

• Tone:
Positive, encouraging, goal-oriented.

• Styling Preferences:
New year visuals, headline, short personal note, and CTA.

The email must include:
1. Happy New Year greeting
2. Inspiring note to start fresh
3. New Year offer or bundle
4. Clear next steps or button`
      },
      {
        title: "Black Friday or Cyber Monday deal",
        subtext: "Send a high-impact sales message for seasonal promotions.",
        id: "Black Friday or Cyber Monday deal",
        prompt: `Write a high-converting Black Friday or Cyber Monday email.

Recipient Info:
To: All contacts

• Purpose of the email:
To drive sales with aggressive discounts and urgency.

• Tone:
Bold, exciting, and urgent.

• Styling Preferences:
Dark or dynamic design, offer spotlight, limited time messaging.

The email must include:
1. Clear “Black Friday” or “Cyber Monday” subject line
2. Discount/offer with start and end date
3. Promo code or auto-apply link
4. CTA button and optional countdown`
      }
    ]
  },
  {
    category: "Customer Engagement Emails",
    prompts: [
      {
        title: "Re-engage an inactive customer",
        subtext: "Reach out to a user who hasn’t been active in a while and offer value to bring them back.",
        id: "Re-engage an inactive customer",
        prompt: `Write a re-engagement email to a previously active user.

• Recipient Info:
Name: Adam Smith
Company: Samsung International LLC

• Purpose of the email:
To re-engage Chris and remind him of the value of the platform.

• Tone:
Encouraging, positive, and curious.

• Styling Preferences:
Short, warm intro. Offer something new or valuable.

The email must include:
1. Acknowledge their absence
2. Highlight a new feature, benefit, or update
3. Invite them back with an incentive or resource
4. Add a CTA to log in or restart usage`
      },
      {
        title: "Collect feedback or testimonials",
        subtext: "Ask for a quick review or testimonial in a light, appreciative tone.",
        id: "Collect feedback or testimonials",
        prompt: `Write a friendly email asking a customer to share feedback or a testimonial.

• Recipient Info:
Name: Adam Smith
Company: Samsung International LLC

• Purpose of the email:
To gather feedback or a testimonial after successful use of your service.

• Tone:
Appreciative, non-pushy, and sincere.

• Styling Preferences:
Start with a thank-you. Keep the request short and optional.

The email must include:
1. Thank them for using your service
2. Mention how their feedback helps others
3. Provide a link or button to submit a review
4. Offer to feature them (optional)`
      },
      {
        title: "Send a welcome message to new subscribers",
        subtext: "Greet new email list subscribers and introduce your brand or offerings.",
        id: "Send a welcome message to new subscribers",
        prompt: `Write a warm welcome email to a new subscriber.

• Recipient Info:
Name: New subscriber

• Purpose of the email:
To introduce your brand and set expectations for future emails.

• Tone:
Friendly, enthusiastic, and informative.

• Styling Preferences:
Use headers or bullets for key benefits.

The email must include:
1. Welcome and thank-you message
2. What they can expect (tips, updates, promos)
3. Link to your best content or offer
4. Optional invite to follow on social or community`
      },
      {
        title: "Notify customers of updates or maintenance",
        subtext: "Inform users of upcoming system changes or improvements in a clear, reassuring tone.",
        id: "Notify customers of updates or maintenance",
        prompt: `Write a clear and professional update email regarding upcoming system changes or downtime.

• Recipient Info:
All users

• Purpose of the email:
To inform about scheduled maintenance or new system features.

• Tone:
Clear, transparent, and calm.

• Styling Preferences:
Use headings, dates, and bullet points for clarity.

The email must include:
1. What’s being updated or maintained
2. Date and time of impact (if any)
3. Any action needed from the user
4. Reassurance and link to more info`
      }
    ]
  },
  {
    category: "Occasion-Based Emails",
    prompts: [
      {
        title: "Birthday message with a small gift or offer",
        subtext: "Celebrate your customer's birthday and offer a discount or freebie.",
        id: "Birthday message with a small gift or offer",
        prompt: `Write a cheerful birthday email with a special gift or discount.

• Recipient Info:
Customer with a birthday today

• Purpose of the email:
To celebrate the customer's birthday and boost engagement or sales.

• Tone:
Festive, personal, and thoughtful.

• Styling Preferences:
Include birthday imagery or theme, and a clear reward.

The email must include:
1. Happy birthday greeting
2. Personalized mention of their relationship with your brand
3. Gift, discount, or freebie details
4. CTA to redeem offer`
      },
      {
        title: "Anniversary or milestone celebration",
        subtext: "Congratulate a customer or partner on a business milestone or time with your service.",
        id: "Anniversary or milestone celebration",
        prompt: `Write a congratulatory email for a customer’s anniversary with your company.

• Recipient Info:
Longtime customer

• Purpose of the email:
To recognize their loyalty and relationship milestone.

• Tone:
Appreciative, celebratory, and warm.

• Styling Preferences:
Use celebratory visuals or emoji, short highlight of the journey.

The email must include:
1. Congratulate on X years/months with you
2. Mention what they've achieved or unlocked
3. Offer a reward, badge, or discount
4. Invite continued success or feedback`
      },
      {
        title: "Send a thank-you note during Thanksgiving",
        subtext: "Show appreciation to customers and partners during the holiday season.",
        id: "Send a thank-you note during Thanksgiving",
        prompt: `Write a heartfelt Thanksgiving thank-you message.

• Recipient Info:
Customers and partners

• Purpose of the email:
To express appreciation for their support over the year.

• Tone:
Grateful, warm, and genuine.

• Styling Preferences:
Holiday tone, soft and personal messaging.

The email must include:
1. A warm Thanksgiving greeting
2. A thank-you message for their trust or partnership
3. Optional mention of any holiday hours or special content
4. A sincere sign-off`
      },
      {
        title: "Send a congratulations note for New Year's",
        subtext: "Show appreciation to customers and partners for New Year's.",
        id: "Send a congratulations note for New Year's",
        prompt: `Write a congratulatory and forward-looking New Year's email.

• Recipient Info:
Customers, leads, or partners

• Purpose of the email:
To inspire optimism and show appreciation going into the new year.`
      }
    ]
  }
];
