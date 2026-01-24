// src/components/reviews/review-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { clientLogger } from "@/lib/utils/logger";

interface ReviewFormProps {
  jobId: string;
  tradespersonId?: string;
}

export default function ReviewForm({ jobId, tradespersonId }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tradespersonId) {
      toast.error("No tradesperson assigned to this job.");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please add a short review before submitting.");
      return;
    }

    if (!executeRecaptcha) {
      toast.error("reCAPTCHA is still loading. Please try again shortly.");
      return;
    }

    setLoading(true);

    try {
      let recaptchaToken: string | null = null;

      try {
        recaptchaToken = await executeRecaptcha("submit_review");
      } catch (error) {
        clientLogger.error("[review] executeRecaptcha error", error);
        toast.error("Could not verify reCAPTCHA. Please try again.");
        return;
      }

      if (!recaptchaToken) {
        toast.error("Could not verify reCAPTCHA. Please try again.");
        return;
      }

      // Optionally fetch tradesperson’s Google review URL
      let googleReviewUrl: string | null = null;
      try {
        const tradespersonRes = await fetch(`/api/user/${tradespersonId}`);
        if (tradespersonRes.ok) {
          const tradespersonData = await tradespersonRes.json();
          googleReviewUrl = tradespersonData.user?.googleBusinessProfileUrl ?? null;
        }
      } catch (error) {
        clientLogger.error("[v0] Failed to fetch tradesperson data for Google review URL:", error);
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          tradespersonId,
          rating,
          comment: comment.trim(),
          recaptchaToken
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = data?.error || "Failed to submit review";
        toast.error(message);
        return;
      }

      let redirectUrl = `/dashboard/customer/jobs/${jobId}?review_submitted=true`;
      if (googleReviewUrl) {
        redirectUrl += `&google_review_url=${encodeURIComponent(googleReviewUrl)}`;
      }

      router.push(redirectUrl);
    } catch (error) {
      clientLogger.error("[v0] Failed to submit review:", error);
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="rating">Rating</Label>
        <div className="flex gap-1 mt-1" id="rating">
          {[1, 2, 3, 4, 5].map(star => {
            const active = star <= rating;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                className="p-0"
                data-testid={`star-${star}`}>
                <Star className={"h-6 w-6 " + (active ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="comment">Review</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Describe your experience"
          rows={4}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
