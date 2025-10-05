import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MessageCircle, Trash2, Send, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type CommunityPost = {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string | null;
  likesCount: number | null;
  commentsCount: number | null;
  createdAt: Date | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
};

type CommunityComment = {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
};

export default function Community() {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("General");
  const [commentContent, setCommentContent] = useState("");

  const { data: posts = [], isLoading } = useQuery<CommunityPost[]>({
    queryKey: ["/api/community/posts"],
  });

  const { data: postDetails } = useQuery<CommunityPost & { comments: CommunityComment[] }>({
    queryKey: ["/api/community/posts", selectedPost],
    enabled: !!selectedPost,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string }) => {
      await apiRequest("POST", "/api/community/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setIsCreateDialogOpen(false);
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostCategory("General");
      toast({ title: "Post created successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create post", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: { postId: string; content: string }) => {
      await apiRequest("POST", `/api/community/posts/${data.postId}/comments`, { content: data.content });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setCommentContent("");
      toast({ title: "Comment added!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to add comment", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("POST", `/api/community/posts/${postId}/like`);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to like post", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("DELETE", `/api/community/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setSelectedPost(null);
      toast({ title: "Post deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete post", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredPosts = selectedCategory === "all" 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  const categories = ["Success Stories", "Questions", "Tips & Strategies", "Product Showcase", "General"];

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading community...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-community-title">Community</h1>
            <p className="text-muted-foreground">Connect with fellow digital product creators building €100k+ businesses</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-post">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-create-post">
              <DialogHeader>
                <DialogTitle>Create Post</DialogTitle>
                <DialogDescription>Share your knowledge, ask questions, or showcase your products</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    data-testid="input-post-title"
                    placeholder="What's your post about?"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                    <SelectTrigger data-testid="select-post-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    data-testid="input-post-content"
                    placeholder="Share your thoughts..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={5}
                  />
                </div>
                <Button
                  data-testid="button-submit-post"
                  onClick={() => createPostMutation.mutate({ 
                    title: newPostTitle, 
                    content: newPostContent, 
                    category: newPostCategory 
                  })}
                  disabled={!newPostTitle || !newPostContent || !newPostCategory || createPostMutation.isPending}
                  className="w-full"
                >
                  {createPostMutation.isPending ? "Creating..." : "Create Post"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} data-testid={`tab-${cat.toLowerCase().replace(/ /g, '-')}`}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No posts yet in this category</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Create the first post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map(post => (
              <Card 
                key={post.id} 
                className="hover-elevate cursor-pointer" 
                onClick={() => setSelectedPost(post.id)}
                data-testid={`card-post-${post.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar>
                        <AvatarImage src={post.user.profileImageUrl || undefined} />
                        <AvatarFallback>{getInitials(post.user.firstName, post.user.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg" data-testid={`text-post-title-${post.id}`}>{post.title}</CardTitle>
                        <CardDescription>
                          <span className="font-medium">
                            {post.user.firstName} {post.user.lastName}
                          </span>
                          {" · "}
                          {post.createdAt && formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </CardDescription>
                      </div>
                    </div>
                    {post.category && (
                      <Badge variant="secondary" data-testid={`badge-category-${post.id}`}>{post.category}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        likePostMutation.mutate(post.id);
                      }}
                      className="flex items-center gap-1 hover-elevate px-2 py-1 rounded-md"
                      data-testid={`button-like-${post.id}`}
                    >
                      <Heart className="h-4 w-4" />
                      <span>{post.likesCount || 0}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.commentsCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedPost && postDetails && (
          <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="dialog-post-details">
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar>
                      <AvatarImage src={postDetails.user.profileImageUrl || undefined} />
                      <AvatarFallback>{getInitials(postDetails.user.firstName, postDetails.user.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <DialogTitle data-testid="text-post-detail-title">{postDetails.title}</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">
                          {postDetails.user.firstName} {postDetails.user.lastName}
                        </span>
                        {" · "}
                        {postDetails.createdAt && formatDistanceToNow(new Date(postDetails.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {postDetails.category && <Badge variant="secondary">{postDetails.category}</Badge>}
                    {user?.id === postDetails.userId && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deletePostMutation.mutate(postDetails.id)}
                        data-testid="button-delete-post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-6">
                <p className="text-sm whitespace-pre-wrap" data-testid="text-post-content">{postDetails.content}</p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground border-y py-3">
                  <button
                    onClick={() => likePostMutation.mutate(postDetails.id)}
                    className="flex items-center gap-1 hover-elevate px-2 py-1 rounded-md"
                    data-testid="button-like-detail"
                  >
                    <Heart className="h-4 w-4" />
                    <span>{postDetails.likesCount || 0}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{postDetails.commentsCount || 0}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Comments</h3>
                  
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback>{getInitials(user?.firstName || null, user?.lastName || null)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        rows={2}
                        data-testid="input-comment"
                      />
                      <Button
                        size="sm"
                        onClick={() => createCommentMutation.mutate({ 
                          postId: selectedPost, 
                          content: commentContent 
                        })}
                        disabled={!commentContent || createCommentMutation.isPending}
                        data-testid="button-submit-comment"
                      >
                        <Send className="h-4 w-4" />
                        Comment
                      </Button>
                    </div>
                  </div>

                  {postDetails.comments && postDetails.comments.length > 0 && (
                    <div className="space-y-4">
                      {postDetails.comments.map(comment => (
                        <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.user.profileImageUrl || undefined} />
                            <AvatarFallback>{getInitials(comment.user.firstName, comment.user.lastName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {comment.user.firstName} {comment.user.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
