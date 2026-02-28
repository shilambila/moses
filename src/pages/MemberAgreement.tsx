import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const MemberAgreement = () => {
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Member Agreement</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-gray max-w-none">
            <div className="space-y-6 text-foreground">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Membership Commitment</h2>
                <p>
                  By signing this agreement, I commit to being an active and supportive member of 
                  Team No Struggle Welfare Group. I understand that this is a mutual aid organization 
                  built on trust, solidarity, and shared responsibility.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">2. Financial Obligations</h2>
                <p>I agree to:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Pay my monthly contribution by the 5th of each month</li>
                  <li>Contribute additional amounts for emergency assistance when called upon</li>
                  <li>Pay any applicable penalties for late payments</li>
                  <li>Maintain my membership in good standing through consistent contributions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">3. Participation Requirements</h2>
                <p>As a member, I commit to:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Attend monthly meetings or send a representative</li>
                  <li>Participate in group activities and community service</li>
                  <li>Support fellow members during their times of need</li>
                  <li>Follow group decisions made through democratic processes</li>
                  <li>Maintain confidentiality of sensitive group matters</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Code of Conduct</h2>
                <p>I agree to:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Treat all members with respect and dignity</li>
                  <li>Avoid conflicts of interest that could harm the group</li>
                  <li>Report any misconduct or financial irregularities</li>
                  <li>Support the group's mission and values</li>
                  <li>Resolve disputes through proper channels</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Benefits and Assistance</h2>
                <p>I understand that:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Benefits are provided based on available funds and group approval</li>
                  <li>Emergency assistance requires proper documentation and verification</li>
                  <li>I must be in good standing to receive benefits</li>
                  <li>The group reserves the right to investigate benefit claims</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Leadership and Governance</h2>
                <p>
                  I acknowledge the authority of elected group officials and agree to participate 
                  in the democratic governance of the organization. I may seek leadership positions 
                  and will support elected leaders in their duties.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Resignation and Termination</h2>
                <p>
                  I may resign from the group with 30 days written notice. I understand that 
                  involuntary termination may occur for violations of this agreement or group policies. 
                  Upon termination, I forfeit any claim to contributed funds.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Agreement Acceptance</h2>
                <p>
                  By joining Team No Struggle Welfare Group, I acknowledge that I have read, 
                  understood, and agree to be bound by this Member Agreement and all group policies.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberAgreement;