'use client';

import { useEffect, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import {
  useAdminBlogPosts,
  useCreateBlogPost,
  useDeleteBlogPost,
  useUpdateBlogPost,
  type BlogInput,
  type BlogPost,
} from '@/hooks/admin/use-blog';

const EMPTY_FORM: BlogInput = {
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: 'Health Tips',
  tags: [],
  isPublished: false,
};

export default function BlogAdminPage() {
  const { data, isLoading } = useAdminBlogPosts(1);
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogInput>(EMPTY_FORM);
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        excerpt: editing.excerpt ?? '',
        content: editing.content,
        coverImage: editing.coverImage ?? '',
        category: editing.category,
        tags: editing.tags,
        isPublished: editing.isPublished,
      });
      setTagsInput(editing.tags.join(', '));
    } else {
      setForm(EMPTY_FORM);
      setTagsInput('');
    }
  }, [editing]);

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function handleSubmit() {
    const payload = { ...form, tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean) };
    if (editing) {
      updatePost.mutate({ id: editing.id, input: payload }, { onSuccess: () => setOpen(false) });
    } else {
      createPost.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Health Blog</h1>
        <Button className="w-full sm:w-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Views</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td className="p-4 text-muted-foreground" colSpan={6}>Loading...</td></tr>
                ) : data && data.items.length > 0 ? (
                  data.items.map((post) => (
                    <tr key={post.id} className="border-b border-border/40">
                      <td className="p-3 font-medium">{post.title}</td>
                      <td className="p-3">{post.category}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3.5 w-3.5" /> {post.views}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge variant={post.isPublished ? 'success' : 'secondary'}>{post.isPublished ? 'Published' : 'Draft'}</Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDate(post.createdAt)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setEditing(post);
                            setOpen(true);
                          }}
                          className="mr-2 text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => deletePost.mutate(post.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="p-4 text-muted-foreground" colSpan={6}>No blog posts yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border/60 md:hidden">
            {isLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading...</p>
            ) : data && data.items.length > 0 ? (
              data.items.map((post) => (
                <div key={post.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-muted-foreground">{post.category}</p>
                    </div>
                    <Badge variant={post.isPublished ? 'success' : 'secondary'}>
                      {post.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" /> {post.views} views / {formatDate(post.createdAt)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(post);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deletePost.mutate(post.id)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-muted-foreground">No blog posts yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Post' : 'New Post'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div>
              <Label>Content</Label>
              <textarea
                className="w-full rounded-lg border border-input bg-background p-2 text-sm"
                rows={10}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div>
                <Label>Cover Image URL</Label>
                <Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
              Published
            </label>
            <Button onClick={handleSubmit} disabled={createPost.isPending || updatePost.isPending}>
              {editing ? 'Save Changes' : 'Create Post'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
