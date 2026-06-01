import { useState, useRef, useEffect } from "react";
import { MessageCircle, ImagePlus, Send, Trash2, X, Leaf, ChevronDown, ChevronUp, Plus, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCommunityPosts,
  useCreateCommunityPost,
  useDeleteCommunityPost,
  useListCommunityComments,
  useCreateCommunityComment,
  useDeleteCommunityComment,
  getListCommunityPostsQueryKey,
  getListCommunityCommentsQueryKey,
  useGetUserProfile,
  useUpdateUserProfile,
  getGetUserProfileQueryKey,
  type CommunityPost,
  type CommunityComment,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { formatDistanceToNow } from "date-fns";

const LAWN_RX_NAME_RE = /^[a-zA-Z0-9 _\-.]{3,30}$/;

function validateName(name: string): string | null {
  if (name.length < 3) return "Name must be at least 3 characters.";
  if (name.length > 30) return "Name must be 30 characters or fewer.";
  if (!LAWN_RX_NAME_RE.test(name)) return "Letters, numbers, spaces, hyphens, underscores, and dots only.";
  return null;
}

function Avatar({ name, src, size = "sm" }: { name: string; src?: string | null; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
  if (src) return <img src={src} alt={name} className={`${sz} rounded-full object-cover shrink-0`} />;
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`${sz} rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0`}>
      {initials || <Leaf className="w-3.5 h-3.5" />}
    </div>
  );
}

function timeAgo(dateStr: string) {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); } catch { return ""; }
}

function NamePickerModal({ onClose, required }: { onClose: () => void; required?: boolean }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const updateProfile = useUpdateUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async () => {
    const trimmed = name.trim();
    const validationError = validateName(trimmed);
    if (validationError) { setError(validationError); return; }
    try {
      await updateProfile.mutateAsync({ data: { lawnRxName: trimmed } });
      queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
      toast({ title: `Name set to "${trimmed}" 🌿` });
      onClose();
    } catch {
      toast({ title: "Failed to save name", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="bg-emerald-700 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-base leading-tight">Choose your LawnRX name</p>
              <p className="text-emerald-100 text-xs mt-0.5">This is how you'll appear in the community.</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Display name</label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. GrassWhisperer42"
              maxLength={30}
              className="w-full text-sm bg-muted/50 border border-border/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-muted-foreground/60"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-[11px] text-muted-foreground">3–30 characters. Letters, numbers, spaces, hyphens, underscores, dots.</p>
          </div>

          <div className="flex gap-2.5">
            {!required && (
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                Cancel
              </Button>
            )}
            <Button
              onClick={submit}
              disabled={!name.trim() || updateProfile.isPending}
              className="flex-1 rounded-xl bg-emerald-700 hover:bg-emerald-800"
            >
              {updateProfile.isPending ? "Saving…" : <><Check className="w-4 h-4 mr-1.5" /> Save name</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentThread({ postId, currentUserId }: { postId: string; currentUserId: string }) {
  const [text, setText] = useState("");
  const { data: comments = [], isLoading } = useListCommunityComments(postId);
  const createComment = useCreateCommunityComment();
  const deleteComment = useDeleteCommunityComment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await createComment.mutateAsync({ id: postId, data: { content: trimmed } });
      setText("");
      queryClient.invalidateQueries({ queryKey: getListCommunityCommentsQueryKey(postId) });
      queryClient.invalidateQueries({ queryKey: getListCommunityPostsQueryKey() });
    } catch {
      toast({ title: "Failed to post comment", variant: "destructive" });
    }
  };

  const remove = async (commentId: string) => {
    await deleteComment.mutateAsync({ commentId });
    queryClient.invalidateQueries({ queryKey: getListCommunityCommentsQueryKey(postId) });
    queryClient.invalidateQueries({ queryKey: getListCommunityPostsQueryKey() });
  };

  return (
    <div className="mt-3 space-y-3 pt-3 border-t border-border/50">
      {isLoading ? (
        <p className="text-xs text-muted-foreground text-center py-2">Loading comments…</p>
      ) : (comments as CommunityComment[]).length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-1">No comments yet. Be first!</p>
      ) : (
        <div className="space-y-2.5">
          {(comments as CommunityComment[]).map((c) => (
            <div key={c.id} className="flex gap-2.5 group">
              <Avatar name={c.userName} src={c.userAvatar} />
              <div className="flex-1 min-w-0 bg-muted/50 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{c.userName}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    {c.userId === currentUserId && (
                      <button
                        onClick={() => remove(c.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm mt-0.5 text-foreground/80">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), submit())}
          placeholder="Add a comment…"
          maxLength={500}
          className="flex-1 text-sm bg-muted/50 border border-border/50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-muted-foreground/60"
        />
        <Button
          size="sm"
          onClick={submit}
          disabled={!text.trim() || createComment.isPending}
          className="rounded-xl shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function PostCard({ post, currentUserId }: { post: CommunityPost; currentUserId: string }) {
  const [expanded, setExpanded] = useState(false);
  const deletePost = useDeleteCommunityPost();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const remove = async () => {
    try {
      await deletePost.mutateAsync({ id: post.id });
      queryClient.invalidateQueries({ queryKey: getListCommunityPostsQueryKey() });
    } catch {
      toast({ title: "Failed to delete post", variant: "destructive" });
    }
  };

  return (
    <Card className="overflow-hidden border border-border/60 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Avatar name={post.userName} src={post.userAvatar} size="md" />
            <div>
              <p className="font-semibold text-sm leading-tight">{post.userName}</p>
              <p className="text-[11px] text-muted-foreground">{timeAgo(post.createdAt)}</p>
            </div>
          </div>
          {post.userId === currentUserId && (
            <button
              onClick={remove}
              disabled={deletePost.isPending}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-sm text-foreground/90 leading-relaxed">{post.caption}</p>

        {post.photoDataUrl && (
          <div className="rounded-xl overflow-hidden bg-muted">
            <img
              src={post.photoDataUrl}
              alt="Lawn photo"
              className="w-full max-h-72 object-cover"
            />
          </div>
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {expanded && <CommentThread postId={post.id} currentUserId={currentUserId} />}
      </CardContent>
    </Card>
  );
}

function NewPostSheet({ onClose, lawnRxName }: { onClose: () => void; lawnRxName: string | null }) {
  const [caption, setCaption] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [showNamePicker, setShowNamePicker] = useState(!lawnRxName);
  const fileRef = useRef<HTMLInputElement>(null);
  const createPost = useCreateCommunityPost();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (showNamePicker) {
    return (
      <NamePickerModal
        required
        onClose={() => {
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
          setShowNamePicker(false);
        }}
      />
    );
  }

  const compressImage = (dataUrl: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = dataUrl;
    });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target!.result as string);
      setPhotoDataUrl(compressed);
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!caption.trim()) return;
    try {
      await createPost.mutateAsync({ data: { caption: caption.trim(), photoDataUrl: photoDataUrl ?? undefined } });
      queryClient.invalidateQueries({ queryKey: getListCommunityPostsQueryKey() });
      toast({ title: "Posted!" });
      onClose();
    } catch {
      toast({ title: "Failed to post", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">New Post</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Share your lawn story, ask a question, or celebrate progress…"
          maxLength={1000}
          rows={4}
          className="w-full text-sm bg-muted/50 border border-border/50 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-muted-foreground/60 resize-none"
        />

        {photoDataUrl ? (
          <div className="relative rounded-xl overflow-hidden bg-muted">
            <img src={photoDataUrl} alt="Preview" className="w-full max-h-48 object-cover" />
            <button
              onClick={() => setPhotoDataUrl(null)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-600 transition-colors border border-dashed border-border/60 hover:border-emerald-400 rounded-xl px-4 py-3 w-full justify-center"
          >
            <ImagePlus className="w-4 h-4" />
            Add a lawn photo (optional)
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        <Button
          onClick={submit}
          disabled={!caption.trim() || createPost.isPending}
          className="w-full rounded-xl"
        >
          {createPost.isPending ? "Posting…" : "Post to Community"}
        </Button>
      </div>
    </div>
  );
}

export default function Community() {
  const { data: posts = [], isLoading } = useListCommunityPosts();
  const { data: profile, isLoading: profileLoading } = useGetUserProfile();
  const { user } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [showNamePicker, setShowNamePicker] = useState(false);

  const lawnRxName = profile?.lawnRxName ?? null;
  const currentUserId = (user as any)?.id ?? "";

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Community</h1>
          <p className="text-sm text-muted-foreground">Share lawn progress, ask questions, and help each other grow.</p>
        </div>
        <Button onClick={() => setShowNew(true)} size="sm" className="rounded-xl gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> Post
        </Button>
      </div>

      {!profileLoading && (
        <div className="flex items-center gap-2.5 bg-muted/40 border border-border/50 rounded-xl px-4 py-3">
          <div className="flex-1 min-w-0">
            {lawnRxName ? (
              <p className="text-sm">
                Posting as <span className="font-semibold text-emerald-700 dark:text-emerald-400">{lawnRxName}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">No display name set.</span> Add one so the community knows you!
              </p>
            )}
          </div>
          <button
            onClick={() => setShowNamePicker(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 transition-colors shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            {lawnRxName ? "Edit" : "Set name"}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (posts as CommunityPost[]).length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
            <Leaf className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="font-semibold text-lg">No posts yet</p>
          <p className="text-sm text-muted-foreground">Be the first to share your lawn journey!</p>
          <Button onClick={() => setShowNew(true)} className="rounded-xl mt-2">
            <Plus className="w-4 h-4 mr-2" /> Create First Post
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {(posts as CommunityPost[]).map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      {showNew && <NewPostSheet lawnRxName={lawnRxName} onClose={() => setShowNew(false)} />}
      {showNamePicker && <NamePickerModal onClose={() => setShowNamePicker(false)} />}
    </div>
  );
}
