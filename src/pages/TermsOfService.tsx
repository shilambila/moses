import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-gray max-w-none">
            <div className="space-y-6 text-foreground">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p>
                  By becoming a member of Team No Struggle Welfare Group, you agree to be bound by these Terms of Service. 
                  These terms constitute a legal agreement between you and the organization.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Membership Obligations</h2>
                <p>As a member, you agree to:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Pay monthly contributions as specified in your membership plan</li>
                  <li>Provide accurate and up-to-date personal information</li>
                  <li>Attend required meetings and activities</li>
                  <li>Respect other members and maintain group unity</li>
                  <li>Follow all group rules and regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Financial Responsibilities</h2>
                <p>
                  Members are required to make timely monthly contributions according to their selected plan. 
                  Late payments may result in penalties or suspension of benefits. All financial obligations 
                  must be fulfilled before requesting assistance from the group.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Benefits and Support</h2>
                <p>
                  The group provides financial assistance during times of need, including but not limited to 
                  medical emergencies, bereavement, and other qualifying circumstances. Benefits are subject 
                  to availability of funds and approval by the group leadership.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Termination</h2>
                <p>
                  Membership may be terminated voluntarily by the member or involuntarily by the group for 
                  violations of these terms. Upon termination, no refunds of contributions will be made, 
                  but any pending benefits may be processed at the group's discretion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Dispute Resolution</h2>
                <p>
                  Any disputes arising from membership or these terms will be resolved through the group's 
                  internal dispute resolution process before seeking external legal remedies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Amendments</h2>
                <p>
                  These terms may be amended by the group leadership with proper notice to all members. 
                  Continued membership after such amendments constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Contact Information</h2>
                <p>
                  For questions about these terms, please contact us at support@teamnostruggle.org or 
                  visit our community center in Kakamega.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;