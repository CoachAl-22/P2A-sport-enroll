import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import Classes from "@/pages/classes";
import NotFound from "@/pages/not-found";
import Foundation from "@/pages/foundation";
import EmergingAthletes from "@/pages/emerging-athletes";
import TeamSportSpeed from "@/pages/team-sport-speed";
import Programs from "@/pages/programs";

const HighPerformance = lazy(() => import("@/pages/high-performance"));
const SeniorSquad = lazy(() => import("@/pages/senior-squad"));
const JuniorAcademy = lazy(() => import("@/pages/junior-academy"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Enrollment = lazy(() => import("@/pages/enrollment"));
const Admin = lazy(() => import("@/pages/admin"));
const Import = lazy(() => import("@/pages/import"));
const Checkout = lazy(() => import("@/pages/checkout"));
const Analytics = lazy(() => import("@/pages/analytics"));
const AdminSMS = lazy(() => import("@/pages/admin-sms"));
const Blog = lazy(() => import("@/pages/blog"));
const BlogArticle = lazy(() => import("@/pages/blog-article"));
const AdminBlog = lazy(() => import("@/pages/admin-blog"));
const AdminTermConfig = lazy(() => import("@/pages/admin-term-config"));
const AdminSetupTerm = lazy(() => import("@/pages/admin-setup-term"));
const AdminClasses = lazy(() => import("@/pages/admin-classes"));
const AdminStaff = lazy(() => import("@/pages/admin-staff"));
const AdminCustomers = lazy(() => import("@/pages/admin-customers"));
const AdminEnquiries = lazy(() => import("@/pages/admin-enquiries"));
const Attendance = lazy(() => import("@/pages/attendance"));
const Waitlist = lazy(() => import("@/pages/waitlist"));
const ParentHelpCenter = lazy(() => import("@/pages/parent-help-center"));
const EnrollmentGuide = lazy(() => import("@/pages/enrollment-guide"));
const PaymentSupport = lazy(() => import("@/pages/payment-support"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const VideoHighlights = lazy(() => import("@/pages/video-highlights"));
const SharedVideo = lazy(() => import("@/pages/shared-video"));
const VideoHighlightsParent = lazy(() => import("@/components/video-highlights-parent"));
const AthletePortal = lazy(() => import("@/pages/athlete-portal"));
const Coaches = lazy(() => import("@/pages/coaches"));
const Questionnaire = lazy(() => import("@/pages/questionnaire"));
const AdminAthletes = lazy(() => import("@/pages/admin-athletes"));
const AdminMajAthletes = lazy(() => import("@/pages/admin-maj-athletes"));
const AdminApplications = lazy(() => import("@/pages/admin-applications"));
const AdminSurveys = lazy(() => import("@/pages/admin-surveys"));
const AdminTrials = lazy(() => import("@/pages/admin-trials"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const ConfirmationPage = lazy(() => import("@/pages/confirmation"));
const ReEnrol = lazy(() => import("@/pages/re-enrol"));

function PageSpinner() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <PageSpinner />;
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/classes" component={Classes} />
          <Route path="/coaches" component={Coaches} />
          <Route path="/high-performance" component={HighPerformance} />
          <Route path="/senior-squad" component={SeniorSquad} />
          <Route path="/junior-academy" component={JuniorAcademy} />
          <Route path="/foundation" component={Foundation} />
          <Route path="/emerging-athletes" component={EmergingAthletes} />
          <Route path="/team-sport-speed" component={TeamSportSpeed} />
          <Route path="/programs" component={Programs} />
          <Route path="/blog" component={Blog} />
          <Route path="/education" component={Blog} />
          <Route path="/blog/:slug" component={BlogArticle} />
          <Route path="/education/:slug" component={BlogArticle} />
          <Route path="/parent-help-center" component={ParentHelpCenter} />
          <Route path="/enrollment-guide" component={EnrollmentGuide} />
          <Route path="/payment-support" component={PaymentSupport} />
          <Route path="/questionnaire" component={Questionnaire} />
          <Route path="/questionnaire.html" component={Questionnaire} />
          <Route path="/enrollment/:classId" component={Enrollment} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/checkout/:enrollmentId" component={Checkout} />
          <Route path="/confirmation" component={ConfirmationPage} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/re-enrol" component={ReEnrol} />
          <Route path="/video-highlights/:shareableLink" component={SharedVideo} />
        </>
      ) : (
        <>
          {/* Logged-in users still land on the public homepage; their dashboard lives at /dashboard (admins use /admin) */}
          <Route path="/" component={Landing} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/athlete-portal" component={AthletePortal} />
          <Route path="/classes" component={Classes} />
          <Route path="/coaches" component={Coaches} />
          <Route path="/high-performance" component={HighPerformance} />
          <Route path="/senior-squad" component={SeniorSquad} />
          <Route path="/junior-academy" component={JuniorAcademy} />
          <Route path="/foundation" component={Foundation} />
          <Route path="/emerging-athletes" component={EmergingAthletes} />
          <Route path="/team-sport-speed" component={TeamSportSpeed} />
          <Route path="/programs" component={Programs} />
          <Route path="/questionnaire" component={Questionnaire} />
          <Route path="/questionnaire.html" component={Questionnaire} />
          <Route path="/enrollment/:classId" component={Enrollment} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/checkout/:enrollmentId" component={Checkout} />
          <Route path="/confirmation" component={ConfirmationPage} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/re-enrol" component={ReEnrol} />
          <Route path="/waitlist" component={Waitlist} />
          <Route path="/blog" component={Blog} />
          <Route path="/education" component={Blog} />
          <Route path="/blog/:slug" component={BlogArticle} />
          <Route path="/education/:slug" component={BlogArticle} />
          {(user?.role === "coach" || user?.role === "admin") && (
            <>
              <Route path="/attendance" component={Attendance} />
              <Route path="/video-highlights" component={VideoHighlights} />
              <Route path="/onboarding" component={Onboarding} />
            </>
          )}
          {user?.role === "parent" && (
            <Route path="/video-highlights" component={VideoHighlightsParent} />
          )}
          <Route path="/admin" component={Admin} />
          <Route path="/import" component={Import} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/admin/sms" component={AdminSMS} />
          <Route path="/admin/blog" component={AdminBlog} />
          <Route path="/admin/term-config" component={AdminTermConfig} />
          <Route path="/admin/setup-term" component={AdminSetupTerm} />
          <Route path="/admin/classes" component={AdminClasses} />
          <Route path="/admin/staff" component={AdminStaff} />
          <Route path="/admin/customers" component={AdminCustomers} />
          <Route path="/admin/enquiries" component={AdminEnquiries} />
          <Route path="/admin/applications" component={AdminApplications} />
          <Route path="/admin/surveys" component={AdminSurveys} />
          <Route path="/admin/trials" component={AdminTrials} />
          <Route path="/admin/athletes" component={AdminAthletes} />
          <Route path="/admin/maj-athletes" component={AdminMajAthletes} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<PageSpinner />}>
          <Router />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
