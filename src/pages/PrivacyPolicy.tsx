import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-gray max-w-none">
            <div className="space-y-6 text-foreground">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
                <p>We collect the following types of information:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Personal identification information (name, ID number, phone number, email)</li>
                  <li>Financial information related to contributions and benefits</li>
                  <li>Emergency contact information</li>
                  <li>Meeting attendance and participation records</li>
                  <li>Communication preferences</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
                <p>Your information is used to:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Manage your membership and track contributions</li>
                  <li>Process benefit requests and payments</li>
                  <li>Communicate important group updates and meetings</li>
                  <li>Maintain accurate member records</li>
                  <li>Ensure compliance with group policies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Information Sharing</h2>
                <p>
                  We do not sell, trade, or rent your personal information to third parties. 
                  Information may be shared only:
                </p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>With group officials for administrative purposes</li>
                  <li>When required by law or legal process</li>
                  <li>With your explicit consent</li>
                  <li>For emergency contact purposes when necessary</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Data Security</h2>
                <p>
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction. This includes secure storage 
                  of physical records and encrypted digital data where applicable.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Data Retention</h2>
                <p>
                  Member information is retained for the duration of membership and for a period of 7 years 
                  after termination for record-keeping and legal compliance purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Your Rights</h2>
                <p>As a member, you have the right to:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Access your personal information</li>
                  <li>Request corrections to inaccurate information</li>
                  <li>Understand how your information is being used</li>
                  <li>Withdraw consent for non-essential communications</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Changes to This Policy</h2>
                <p>
                  We may update this privacy policy from time to time. Members will be notified of any 
                  significant changes through our regular communication channels.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Contact Us</h2>
                <p>
                  If you have questions about this privacy policy or how we handle your information, 
                  please contact us at support@teamnostruggle.org or visit our community center.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;