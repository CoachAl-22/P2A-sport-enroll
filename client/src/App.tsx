import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import HighPerformance from "@/pages/high-performance";
import SeniorSquad from "@/pages/senior-squad";
import JuniorAcademy from "@/pages/junior-academy";
import Dashboard from "@/pages/dashboard";
import Classes from "@/pages/classes";
import Enrollment from "@/pages/enrollment";
import Admin from "@/pages/admin";
import Import from "@/pages/import";
import Checkout from "@/pages/checkout";
import Analytics from "@/pages/analytics";
import AdminSMS from "@/pages/admin-sms";
import Blog from "@/pages/blog";
import BlogArticle from "@/pages/blog-article";
import AdminBlog from "@/pages/admin-blog";
import AdminTermConfig from "@/pages/admin-term-config";
import AdminClasses from "@/pages/admin-classes";
import AdminStaff from "@/pages/admin-staff";
import AdminCustomers from "@/pages/admin-customers";
import AdminEnquiries from "@/pages/admin-enquiries";
import Attendance from "@/pages/attendance";
import Waitlist from "@/pages/waitlist";
import ParentHelpCenter from "@/pages/parent-help-center";
import EnrollmentGuide from "@/pages/enrollment-guide";
import PaymentSupport from "@/pages/payment-support";
import NotFound from "@/pages/not-found";
import VideoHighlights from "@/pages/video-highlights";
import SharedVideo from "@/pages/shared-video";
import VideoHighlightsParent from "@/components/video-highlights-parent";
import AthletePortal from "@/pages/athlete-portal";
import Coaches from "@/pages/coaches";
import Questionnaire from "@/pages/questionnaire";
import AdminAthletes from "@/pages/admin-athletes";
import AdminApplications from "@/pages/admin-applications";
import AdminSurveys from "@/pages/admin-surveys";
import Onboarding from "@/pages/onboarding";
import ConfirmationPage from "@/pages/confirmation";
import ReEnrol from "@/pages/re-enrol";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
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
          <Route path="/re-enrol" component={ReEnrol} />
          <Route path="/video-highlights/:shareableLink" component={SharedVideo} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/athlete-portal" component={AthletePortal} />
          <Route path="/classes" component={Classes} />
          <Route path="/coaches" component={Coaches} />
          <Route path="/questionnaire" component={Questionnaire} />
          <Route path="/questionnaire.html" component={Questionnaire} />
          <Route path="/enrollment/:classId" component={Enrollment} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/checkout/:enrollmentId" component={Checkout} />
          <Route path="/confirmation" component={ConfirmationPage} />
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
          <Route path="/admin/classes" component={AdminClasses} />
          <Route path="/admin/staff" component={AdminStaff} />
          <Route path="/admin/customers" component={AdminCustomers} />
          <Route path="/admin/enquiries" component={AdminEnquiries} />
          <Route path="/admin/applications" component={AdminApplications} />
          <Route path="/admin/surveys" component={AdminSurveys} />
          <Route path="/admin/athletes" component={AdminAthletes} />
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
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
