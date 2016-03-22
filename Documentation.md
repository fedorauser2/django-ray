# Developers #

To ease development I've created a sandbox that haves Django Ray's trunk as SVN external.

To use it simple checkit out:

```

svn co http://django-ray.googlecode.com/svn/sandbox/ django-ray-sandbox

```

After the checkout, you will find two folder in your working copy: _contrib_ and _sandbox_.

The first holds the external dependencies and the later is only a dummy Django project to test for testing.

If you want to use another branch, simply go in contrib/ and type:

```

svn propedit svn:externals .

```

And then change the SVN path accordingly (you can use a https path if you have commit right).

Note that it's important to commit your changes in contrib/ray/ .. not in the sandbox (unless this is what you really want).