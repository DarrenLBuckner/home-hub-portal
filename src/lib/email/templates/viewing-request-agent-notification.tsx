import * as React from 'react';

interface AgentNotificationEmailProps {
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  visitorMessage: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyId: string;
  agentName: string;
}

export function AgentNotificationEmail({
  visitorName,
  visitorEmail,
  visitorPhone,
  visitorMessage,
  propertyTitle,
  propertyLocation,
  propertyId,
  agentName
}: AgentNotificationEmailProps) {
  return (
    <html>
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>New Viewing Request: {propertyTitle}</title>
        <style>
          {`
            @media only screen and (max-width: 600px) {
              .container { width: 95% !important; }
              .content { padding: 20px 15px !important; }
              .alert-header { padding: 20px 15px !important; }
              .cta-button { padding: 15px 20px !important; font-size: 16px !important; }
              .lead-info { padding: 15px !important; }
            }
          `}
        </style>
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#f8fafc',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#ffffff'
        }} className="container">
          {/* Alert Header */}
          <div style={{
            backgroundColor: '#dc2626',
            padding: '25px 30px',
            textAlign: 'center'
          }} className="alert-header">
            <h1 style={{
              color: '#ffffff',
              margin: 0,
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              🚨 NEW VIEWING REQUEST
            </h1>
            <p style={{
              color: '#fecaca',
              margin: '8px 0 0 0',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              Action Required - New Lead Alert
            </p>
          </div>

          {/* Main Content */}
          <div style={{
            padding: '30px'
          }} className="content">
            <p style={{
              color: '#374151',
              fontSize: '18px',
              lineHeight: '1.6',
              marginBottom: '25px',
              fontWeight: 'bold'
            }}>
              Hi {agentName},
            </p>

            <p style={{
              color: '#dc2626',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '25px',
              fontWeight: 'bold'
            }}>
              You have a new viewing request that requires immediate attention!
            </p>

            {/* Lead Information */}
            <div style={{
              backgroundColor: '#fef3c7',
              border: '2px solid #f59e0b',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '25px'
            }} className="lead-info">
              <h3 style={{
                color: '#92400e',
                fontSize: '18px',
                margin: '0 0 15px 0',
                fontWeight: 'bold'
              }}>
                👤 Lead Contact Details
              </h3>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#92400e' }}>Name:</strong>
                <span style={{ color: '#374151', marginLeft: '8px' }}>{visitorName}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#92400e' }}>Email:</strong>
                <span style={{ color: '#374151', marginLeft: '8px' }}>{visitorEmail}</span>
              </div>
              <div style={{ marginBottom: visitorMessage ? '12px' : '0' }}>
                <strong style={{ color: '#92400e' }}>Phone:</strong>
                <span style={{ color: '#374151', marginLeft: '8px' }}>{visitorPhone}</span>
              </div>
              {visitorMessage && (
                <div>
                  <strong style={{ color: '#92400e' }}>Message:</strong>
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '12px',
                    marginTop: '8px',
                    color: '#374151',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    "{visitorMessage}"
                  </div>
                </div>
              )}
            </div>

            {/* Property Information */}
            <div style={{
              backgroundColor: '#e0f2fe',
              border: '2px solid #0284c7',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px'
            }}>
              <h3 style={{
                color: '#0369a1',
                fontSize: '18px',
                margin: '0 0 15px 0',
                fontWeight: 'bold'
              }}>
                🏠 Property Details
              </h3>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#0369a1' }}>Property:</strong>
                <span style={{ color: '#374151', marginLeft: '8px', fontSize: '16px', fontWeight: 'bold' }}>
                  {propertyTitle}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ color: '#0369a1' }}>Location:</strong>
                <span style={{ color: '#374151', marginLeft: '8px' }}>📍 {propertyLocation}</span>
              </div>
              <div>
                <strong style={{ color: '#0369a1' }}>Property ID:</strong>
                <span style={{ color: '#374151', marginLeft: '8px' }}>{propertyId}</span>
              </div>
            </div>

            {/* Call to Action */}
            <div style={{
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              <h3 style={{
                color: '#dc2626',
                fontSize: '18px',
                marginBottom: '15px',
                fontWeight: 'bold'
              }}>
                ⚡ REPLY TO THIS LEAD NOW
              </h3>
              <p style={{
                color: '#6b7280',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                Quick response increases conversion by 80%
              </p>
              <a href={`mailto:${visitorEmail}?subject=Re: Your Viewing Request for ${propertyTitle}&body=Hi ${visitorName},%0D%0A%0D%0AThank you for your interest in ${propertyTitle}. I'd be happy to arrange a viewing for you.%0D%0A%0D%0AWhen would be a good time for you?%0D%0A%0D%0ABest regards,%0D%0A${agentName}`} style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '18px 32px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '18px',
                display: 'inline-block'
              }} className="cta-button">
                📧 Reply to Lead Now
              </a>
            </div>

            {/* Additional Actions */}
            <div style={{
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '25px'
            }}>
              <h4 style={{
                color: '#374151',
                fontSize: '16px',
                margin: '0 0 15px 0',
                fontWeight: 'bold'
              }}>
                📞 Alternative Contact Options:
              </h4>
              <div style={{ marginBottom: '10px' }}>
                <a href={`tel:${visitorPhone}`} style={{
                  color: '#059669',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}>
                  Call {visitorName}: {visitorPhone}
                </a>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <a href={`sms:${visitorPhone}?body=Hi ${visitorName}, thank you for your interest in ${propertyTitle}. When would be a good time to schedule a viewing?`} style={{
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}>
                  Send SMS to {visitorName}
                </a>
              </div>
            </div>

            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <p style={{
                color: '#dc2626',
                fontSize: '14px',
                margin: 0,
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                ⏰ Best practice: Respond within 5 minutes for highest conversion rates
              </p>
            </div>

            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.5',
              textAlign: 'center'
            }}>
              This lead was generated from your Guyana Home Hub listing. 
              Make sure to provide excellent service to maintain your high rating!
            </p>
          </div>

          {/* Footer */}
          <div style={{
            backgroundColor: '#2563eb',
            padding: '20px 30px',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#ffffff',
              fontSize: '14px',
              margin: '0 0 8px 0',
              fontWeight: 'bold'
            }}>
              Guyana Home Hub Agent Portal
            </p>
            <p style={{
              color: '#bfdbfe',
              fontSize: '12px',
              margin: 0
            }}>
              © 2024 Guyana Home Hub. Helping agents succeed.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}